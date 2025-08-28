// regex-transform.ts
export type TransformRule = {
  /** Unique rule identifier used for building the _map outputs chain */
  id?: string;
  /** Regex pattern as a string (no slashes). Example: "^https?://[^/]+/product/(\\d+)" */
  pattern: string;
  /** Regex flags, e.g. "i", "g", "gi" */
  flags?: string;
  /**
   * Replacement template:
   * - Supports $1, $2... for numbered capture groups
   * - Supports $<name> for named groups (native replace path)
   * - Supports template placeholders with filters: "/${$1|lower}-${$<country>|upper}"
   * - Can be an empty string "" to remove
   * - Literal hardcoded text is allowed, e.g. "/p/$1"
   */
  replacement: string;
  /**
   * If true, stop after this rule. If false/undefined (default), continue with next rules.
   */
  stopOnMatch?: boolean;
  /** Optional description to help with logging/debugging */
  description?: string;
  /**
   * Optional path to the input string for this rule. When provided, the rule's input is read from the
   * original context object (see TransformOptions.context) via this deep path (e.g. "product.data[0].slugUrl").
   */
  inputFieldPath?: string;
  /**
   * When true, this rule's input will be constructed from the running outputs map instead of the previous
   * rule's output. Use together with `input` and `$rule_<id>` tokens.
   */
  fromMap?: boolean;
  /**
   * An explicit input template for this rule. Often used with `fromMap: true`.
   * Supports `$rule_<id>` tokens that are expanded from the running outputs map.
   */
  input?: string;
  /** When inputFieldPath includes "[*]", treats as array rule and joins results */
  startIndex?: number;
  endIndex?: number;
  joinWith?: string;
};

export type TransformOptions = {
  /** If no rule matches, return the original (default: true). If false, throw. */
  returnOriginalOnNoMatch?: boolean;
  /** Log which rule matched (for debug) */
  onMatch?: (rule: TransformRule, before: string, after: string) => void;
  /**
   * Named lookup tables for the `map:<tableName>` filter.
   * Example: { localeCanonical: { "es-mx": "es-us" } }
   */
  maps?: Record<string, Record<string, string>>;
  /** Optional original object used when resolving rule.inputFieldPath */
  context?: any;
  /** Optional hook to collect the final outputs map for debugging/inspection */
  collectMap?: (map: Record<string, string>) => void;
  /** Debug hook: called for each rule with resolved input/pattern/replacement and match result */
  onRuleEvaluated?: (info: {
    rule: TransformRule;
    input: string;
    pattern: string;
    replacement: string;
    matched: boolean;
  }) => void;
};

/* ----------------------- Internal helpers (DSL) ----------------------- */

const TEMPLATE_RE = /\$\{([^}]+)\}/g;

/** Split a filter like "replace:a\:b:c" into ["replace","a:b","c"] (supports escaped colons) */
function splitFilter(token: string): string[] {
  const out: string[] = [];
  let buf = "";
  let esc = false;
  for (const ch of token) {
    if (esc) {
      buf += ch;
      esc = false;
    } else if (ch === "\\") {
      esc = true;
    } else if (ch === ":") {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  out.push(buf);
  return out;
}

function hasTemplateSyntax(s: string): boolean {
  return s.includes("${");
}

type Captures = {
  byIndex: string[];
  byName: Record<string, string | undefined>;
};

function resolveRef(ref: string, caps: Captures): string {
  // $1, $2, ...
  const num = /^\$(\d+)$/.exec(ref);
  if (num) {
    const idx = Number(num[1]);
    return caps.byIndex[idx] ?? "";
  }
  // $<name>
  const named = /^\$<([^>]+)>$/.exec(ref);
  if (named) return caps.byName[named[1]] ?? "";
  // raw literal
  return ref;
}

function applyOneFilter(value: string, name: string, args: string[], maps?: TransformOptions["maps"]): string {
  switch (name) {
    case "lower":
      return value.toLowerCase();
    case "upper":
      return value.toUpperCase();
    case "trim":
      return value.trim();
    case "replace": {
      const [from = "", to = ""] = args;
      return value.split(from).join(to);
    }
    case "regexReplace": {
      const [pat = "", repl = "", flags = ""] = args;
      const re = new RegExp(pat, flags);
      return value.replace(re, repl);
    }
    case "default": {
      const [fallback = ""] = args;
      return value ? value : fallback;
    }
    case "map": {
      const [tableName = ""] = args;
      const table = maps?.[tableName];
      if (!table) return value;
      const key = value;
      return table[key] ?? table[key.toLowerCase()] ?? value;
    }
    case "substr": {
      const start = Number(args[0] ?? "0");
      const len = args[1] !== undefined ? Number(args[1]) : undefined;
      return len === undefined ? value.substring(start) : value.substring(start, start + len);
    }
    case "urlEncode":
      return encodeURIComponent(value);
    case "urlDecode":
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    default:
      // Unknown filter: return value unchanged (fail open)
      return value;
  }
}

function renderTemplate(tpl: string, caps: Captures, maps?: TransformOptions["maps"]): string {
  return tpl.replace(TEMPLATE_RE, (_m, expr: string) => {
    // expr format: <ref>[|filter[:arg1[:arg2...]]...]
    const parts = expr
      .split("|")
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return "";

    // Resolve reference
    let value = resolveRef(parts[0], caps);

    // Apply filters in order
    for (let i = 1; i < parts.length; i++) {
      const seg = parts[i];
      const [fname, ...rawArgs] = splitFilter(seg);
      value = applyOneFilter(value, fname, rawArgs, maps);
    }
    return value;
  });
}

/* ----------------------- Public API ----------------------- */

// Resolve deep values like "product.data[0].slugUrl" from an object
function getValueAtPath(root: any, path: string): any {
  if (!root || !path) return undefined;
  const normalized = path.replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
  const parts = normalized.split(".").filter(Boolean);
  let cur: any = root;
  for (const p of parts) {
    if (cur == null) return undefined;
    const key: any = /^\d+$/.test(p) ? Number(p) : p;
    cur = cur[key];
  }
  return cur;
}

// Expand "$rule_id" tokens using the outputs map
function expandMapTemplate(template: string, outputs: Record<string, string>): string {
  // Support both $rule_foo and $rulefoo tokens.
  // We resolve keys using 3 strategies in order:
  // 1) literal id as-is, 2) with 'rule_' prefix, 3) fallback to empty string.
  return template.replace(/\$rule_?([A-Za-z0-9_-]+)/g, (_m, id) => {
    const direct = outputs[id];
    if (direct !== undefined) return direct;
    const prefixed = outputs[`rule_${id}`];
    if (prefixed !== undefined) return prefixed;
    return "";
  });
}

export function transformString(input: string, rules: TransformRule[], options: TransformOptions = {}): string {
  const { returnOriginalOnNoMatch = true, onMatch, maps, context, collectMap, onRuleEvaluated } = options;
  console.log("Am I even here?");
  let output = input;
  let matchedAtLeastOne = false;
  const outputsMap: Record<string, string> = {};

  for (const rule of rules) {
    // Special handling for Array rules (inputFieldPath contains "[*]")
    const isArrayRule = typeof rule.inputFieldPath === "string" && rule.inputFieldPath.includes("[*]");
    if (isArrayRule) {
      console.log("Is Array Rule!");
      // Split the path into array holder path and optional sub-path for each item
      const m = /^(.*?)(?:\[\*\])(?:\.(.*))?$/.exec(rule.inputFieldPath as string);
      const arrayPath = m && m[1] ? m[1].replace(/\.$/, "") : "";
      const perItemSubPath = m && m[2] ? m[2] : "";

      const arr = getValueAtPath(context, arrayPath);
      const sourceArr = Array.isArray(arr) ? arr : [];

      const start = Math.max(0, Math.min(sourceArr.length, Number(rule.startIndex ?? 0)));
      const end = Math.max(
        0,
        Math.min(sourceArr.length - 1, rule.endIndex != null ? Number(rule.endIndex) : sourceArr.length - 1)
      );

      const sliced = start <= end ? sourceArr.slice(start, end + 1) : [];

      // Resolve string values from each item
      const values: string[] = [];
      for (const item of sliced) {
        let v: any = item;
        if (perItemSubPath) {
          v = getValueAtPath(item, perItemSubPath);
          console.log("Value: ", v);
          if (v === undefined || v === null) continue;
          values.push(String(v));
        } else {
          if (typeof v === "string") {
            values.push(v);
          } else {
            // If no additional path, ensure it's an array of strings – skip non-strings
            continue;
          }
        }
      }

      if (values.length === 0) {
        // No items to process, treat as no-match
        if (rule.id) outputsMap[rule.id] = output;
        if (typeof onRuleEvaluated === "function") {
          try {
            onRuleEvaluated({
              rule,
              input: "",
              pattern: rule.pattern,
              replacement: rule.replacement,
              matched: false,
            });
          } catch {
            console.error("Error occurred while evaluating rule:", rule);
          }
        }
        continue;
      }

      // Resolve pattern/replacement with map token expansion
      const patternResolvedRaw = expandMapTemplate(rule.pattern || "", outputsMap);
      const patternResolved = patternResolvedRaw.trim();
      const replacementResolvedPre = expandMapTemplate(rule.replacement ?? "", outputsMap);

      let re: RegExp;
      try {
        re = new RegExp(patternResolved, rule.flags ?? "");
      } catch (e) {
        // Invalid regex -> treat as no-match for safety
        if (rule.id) outputsMap[rule.id] = output;
        if (typeof onRuleEvaluated === "function") {
          try {
            onRuleEvaluated({
              rule,
              input: values.join(","),
              pattern: patternResolved,
              replacement: replacementResolvedPre,
              matched: false,
            });
          } catch {
            console.error("Error occurred while evaluating rule:", rule);
          }
        }
        continue;
      }

      const anyMatched = values.some((v) => re!.test(v));
      if (typeof onRuleEvaluated === "function") {
        try {
          onRuleEvaluated({
            rule,
            input: values.join(","),
            pattern: patternResolved,
            replacement: replacementResolvedPre,
            matched: anyMatched,
          });
        } catch {
          console.error("Error occurred while evaluating rule:", rule);
        }
      }

      const transformed = values.map((val) => {
        if (hasTemplateSyntax(rule.replacement)) {
          return val.replace(re as RegExp, (...args: any[]) => {
            const match = args[0] as string;
            const maybeGroups = args[args.length - 1];
            const hasNamed = typeof maybeGroups === "object" && maybeGroups !== null;
            const capList = args.slice(1, args.length - (hasNamed ? 3 : 2));
            const caps = {
              byIndex: [match, ...capList],
              byName: (hasNamed ? maybeGroups : {}) as Record<string, string | undefined>,
            };
            return renderTemplate(replacementResolvedPre, caps, maps);
          });
        }
        return val.replace(re as RegExp, replacementResolvedPre);
      });

      const joinWith = rule.joinWith ?? "";
      const nextOut = transformed.join(joinWith);

      if (onMatch) onMatch(rule, values.join(joinWith), nextOut);
      output = nextOut;
      if (rule.id) outputsMap[rule.id] = output;
      if (anyMatched) matchedAtLeastOne = true;
      if (rule.stopOnMatch === true) break;
      continue; // proceed to next rule
    }
    // Determine the input for this rule
    let ruleInput: string = output;
    if (typeof (rule as any).input === "string") {
      // Explicit input template takes highest precedence; expand map tokens
      ruleInput = expandMapTemplate((rule as any).input, outputsMap);
    } else if (rule.inputFieldPath) {
      const v = getValueAtPath(context, rule.inputFieldPath);
      ruleInput = v != null ? String(v) : "";
    } else if (rule.fromMap) {
      // Backward compatibility: fromMap true without explicit input
      ruleInput = expandMapTemplate(rule.input ?? "", outputsMap);
    }

    // Allow pattern to reference prior outputs via $rule_<id>
    const patternResolvedRaw = expandMapTemplate(rule.pattern || "", outputsMap);
    const patternResolved = patternResolvedRaw.trim();
    const replacementResolvedPre = expandMapTemplate(rule.replacement ?? "", outputsMap);

    let re: RegExp | null = null;
    let matched = false;
    try {
      re = new RegExp(patternResolved, rule.flags ?? "");
      matched = re.test(ruleInput);
    } catch (e) {
      // Invalid regex: treat as no-match but surface via callback
      if (typeof onRuleEvaluated === "function") {
        try {
          onRuleEvaluated({
            rule,
            input: ruleInput,
            pattern: patternResolved,
            replacement: replacementResolvedPre,
            matched: false,
          });
        } catch (e) {
          console.log("[Transform:onRuleEvaluated] Error:", e);
        }
      }
      if (rule.id) outputsMap[rule.id] = ruleInput;
      continue;
    }
    if (typeof onRuleEvaluated === "function") {
      try {
        onRuleEvaluated({
          rule,
          input: ruleInput,
          pattern: patternResolved,
          replacement: replacementResolvedPre,
          matched,
        });
      } catch (e) {
        console.log("[Transform:onRuleEvaluated] Error:", e);
      }
    }
    if (!matched) {
      // No match: store passthrough in map (if id) and continue without changing output
      if (rule.id) outputsMap[rule.id] = ruleInput;
      continue;
    }

    matchedAtLeastOne = true;
    let nextOut: string;
    const before = ruleInput;

    if (hasTemplateSyntax(rule.replacement)) {
      const replacementResolved = replacementResolvedPre;
      nextOut = ruleInput.replace(re as RegExp, (...args: any[]) => {
        const match = args[0] as string;
        const maybeGroups = args[args.length - 1];
        const hasNamed = typeof maybeGroups === "object" && maybeGroups !== null;
        const capList = args.slice(1, args.length - (hasNamed ? 3 : 2));

        const caps = {
          byIndex: [match, ...capList],
          byName: (hasNamed ? maybeGroups : {}) as Record<string, string | undefined>,
        };

        return renderTemplate(replacementResolved, caps, maps);
      });
    } else {
      const replacementResolved = replacementResolvedPre;
      nextOut = ruleInput.replace(re as RegExp, replacementResolved);
    }

    if (onMatch) onMatch(rule, before, nextOut);
    output = nextOut;
    if (rule.id) outputsMap[rule.id] = output;

    // ✅ Only stop when explicitly requested
    if (rule.stopOnMatch === true) break;
  }

  if (!matchedAtLeastOne && !returnOriginalOnNoMatch) {
    throw new Error("No transform rule matched input.");
  }

  // Expose map to caller if requested (useful for debugging / UI display)
  if (typeof collectMap === "function") {
    try {
      collectMap({ ...outputsMap });
    } catch {
      // no-op
    }
  }

  return output;
}
