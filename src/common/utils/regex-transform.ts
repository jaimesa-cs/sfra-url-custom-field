// regex-transform.ts
export type TransformRule = {
  /** Regex pattern as a string (no slashes). Example: "^https?://[^/]+/product/(\\d+)" */
  pattern: string;
  /** Regex flags, e.g. "i", "g", "gi" */
  flags?: string;
  /**
   * Replacement template:
   * - Supports $1, $2... for numbered capture groups
   * - Supports $<name> for named groups
   * - Can be an empty string "" to remove
   * - Literal hardcoded text is allowed, e.g. "/p/$1"
   */
  replacement: string;
  /**
   * If true, apply this rule and stop (default). If false, keep going and
   * allow subsequent rules to continue transforming the string.
   */
  stopOnMatch?: boolean;
  /**
   * Optional description to help with logging/debugging
   */
  description?: string;
};

export type TransformOptions = {
  /** If no rule matches, return the original (default: true). If false, throw. */
  returnOriginalOnNoMatch?: boolean;
  /** Log which rule matched (for debug) */
  onMatch?: (rule: TransformRule, before: string, after: string) => void;
};

export function transformString(input: string, rules: TransformRule[], options: TransformOptions = {}): string {
  const { returnOriginalOnNoMatch = true, onMatch } = options;

  let output = input;
  let matchedAtLeastOne = false;

  for (const rule of rules) {
    const re = new RegExp(rule.pattern, rule.flags ?? "");
    if (!re.test(output)) continue;

    matchedAtLeastOne = true;

    // Use String.replace so $1, $2, $<name> just work
    const before = output;
    output = output.replace(re, rule.replacement);

    if (onMatch) onMatch(rule, before, output);
    if (rule.stopOnMatch === true) break; // default: stop after first match
  }

  if (!matchedAtLeastOne && !returnOriginalOnNoMatch) {
    throw new Error("No transform rule matched input.");
  }

  return output;
}
