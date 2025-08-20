// regex-transform.ts
export type TransformRule = {
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
   * If true/undefined (default), apply this rule and stop. If false, continue with next rules.
   */
  stopOnMatch?: boolean;
  /** Optional description to help with logging/debugging */
  description?: string;
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

export function transformString(input: string, rules: TransformRule[], options: TransformOptions = {}): string {
  const { returnOriginalOnNoMatch = true, onMatch, maps } = options;

  let output = input;
  let matchedAtLeastOne = false;

  for (const rule of rules) {
    const re = new RegExp(rule.pattern, rule.flags ?? "");
    if (!re.test(output)) continue;

    matchedAtLeastOne = true;
    const before = output;

    if (hasTemplateSyntax(rule.replacement)) {
      output = output.replace(re, (...args: any[]) => {
        const match = args[0] as string;
        const maybeGroups = args[args.length - 1];
        const hasNamed = typeof maybeGroups === "object" && maybeGroups !== null;
        const capList = args.slice(1, args.length - (hasNamed ? 3 : 2));

        const caps = {
          byIndex: [match, ...capList],
          byName: (hasNamed ? maybeGroups : {}) as Record<string, string | undefined>,
        };

        return renderTemplate(rule.replacement, caps, maps);
      });
    } else {
      output = output.replace(re, rule.replacement);
    }

    if (onMatch) onMatch(rule, before, output);

    // ✅ Only stop when explicitly requested
    if (rule.stopOnMatch === true) break;
  }

  if (!matchedAtLeastOne && !returnOriginalOnNoMatch) {
    throw new Error("No transform rule matched input.");
  }

  return output;
}
