# Regex Transform Rules

This document describes the URL transform pipeline used by the SFRA URL utilities in this repo. Rules are executed in order against an input string, producing a final output. Each rule can optionally read its input from the entry via a deep path, or from prior rule outputs.

At a glance:
- Each rule has a `pattern` (RegExp) and a `replacement` (string template). If `pattern` matches the rule input, the replacement is applied.
- Templates support capture references and simple filters: `${$1|lower}`, `${$<name>|upper}`, `${$1|replace::-/}` etc.
- Input can come from the previous rule’s output, from a deep path in the entry (`inputFieldPath`), or be explicitly provided (`input`) and interpolated with prior outputs.
- Array rules are supported when `inputFieldPath` contains `[*]`.

## Rule Schema

Required
- pattern: String regex (no surrounding slashes). Example: `^(.+)$` or `^(?<seg>.+)$`
- replacement: Replacement with optional template placeholders. Example: `"/p/${$1|lower}"`

Optional
- flags: Regex flags such as `g`, `i`, `gi`.
- id: Identifier to store this rule’s output into the outputs-map (usable by later rules).
- stopOnMatch: When true, stop processing after this rule matches.
- inputFieldPath: Deep path into the entry context. Supports array indices, e.g. `product.data[0].slugUrl`.
- fromMap: Read input from the outputs-map (mainly for backward‑compat). Usually use `input` instead.
- input: Explicit input string that can reference previous outputs via `$rule_<id>` tokens.
- startIndex, endIndex, joinWith: Only for array rules (see below).

## Template Placeholders and Filters

Use `${...}` to render dynamic values based on regex captures:
- `$1`, `$2`, ...: Numbered capture groups
- `$<name>`: Named capture groups (JS named groups)

Filters (chainable): `${<ref>|filter[:arg1[:arg2...]]}`
- lower, upper, trim
- replace: `${$1|replace:from:to}` (colons in args can be escaped with `\`)
- regexReplace: `${$1|regexReplace:pat:repl:flags}`
- default: `${$1|default:fallback}`
- map: `${$1|map:tableName}` (looks up in options.maps)
- substr: `${$1|substr:start[:len]}`
- urlEncode, urlDecode

## Reading Inputs

- Default: a rule reads the previous rule’s output.
- `inputFieldPath`: reads from the entry context. Example: `product.data[0].slugUrl`.
- `input`: override input with a literal/template; can reference outputs by `$rule_<id>` or `$ruleid`.
- `fromMap`: treat `input` as a map template when no `inputFieldPath` is set.

Deep path rules:
- `foo.bar[0].baz` is supported. Bracket indices are normalized.

## Array Rules (inputFieldPath with [*])

When `inputFieldPath` contains `[*]`, the rule iterates over an array slice, applies the regex replacement to each item (as a string), and joins the results.

Fields
- inputFieldPath: Path that includes `[*]` to point at an array. Any sub‑path after `[*]` is applied per item. Example: `custom.data[0].parentCategoryTree[*].name`.
- startIndex: Optional start index (inclusive). Default `0`.
- endIndex: Optional end index (inclusive). Default last index.
- joinWith: Optional join delimiter. Default `""`.

Notes
- If there is no sub‑path after `[*]`, the array itself must be an array of strings; non‑strings are skipped.
- A rule is treated as “matched” if at least one array item exists; per‑item replacements are then joined.

Example

Entry excerpt:
```json
{
  "custom": {
    "data": [
      {
        "parentCategoryTree": [
          { "id": "womens", "name": "Womens" },
          { "id": "womens-clothing", "name": "Clothing" },
          { "id": "womens-clothing-feeling-red", "name": "Feeling Red" }
        ]
      }
    ]
  }
}
```

Rule:
```json
{
  "inputFieldPath": "custom.data[0].parentCategoryTree[*].name",
  "startIndex": 1,
  "pattern": "^(.+)",
  "replacement": "/${$1|upper}",
  "joinWith": "/"
}
```
Result: `/WOMENS/CLOTHING`

## Examples

1) Basic path-based replace
```json
{
  "inputFieldPath": "product.data[0].slugUrl",
  "pattern": "^(.+)$",
  "replacement": "/p/${$1|lower}"
}
```
If `slugUrl` is `Summer-Tees`, output is `/p/summer-tees`.

2) Using flags + named capture
```json
{
  "pattern": "^/product/(?<id>\\\d+)$",
  "flags": "i",
  "replacement": "/p/${$<id>}"
}
```
`/Product/123` -> `/p/123`.

3) Chaining with outputs map
```json
[
  {
    "id": "base",
    "inputFieldPath": "product.data[0].slugUrl",
    "pattern": "^(.+)$",
    "replacement": "${$1|trim|lower}"
  },
  {
    "pattern": "^(.+)$",
    "input": "/products/$rule_base",
    "replacement": "${$1|replace: :_}"
  }
]
```
If `slugUrl` is `Summer Tees`, final output is `/products/summer_tees`.

4) Mapping locales with the `map` filter
```json
{
  "inputFieldPath": "locale",
  "pattern": "^(.+)$",
  "replacement": "/${$1|lower|map:localeCanonical}"
}
```
Where `options.maps.localeCanonical = { "es-mx": "es-us" }`.

5) Array rule (slice + join)
```json
{
  "inputFieldPath": "breadcrumbs[*].label",
  "startIndex": 0,
  "endIndex": 2,
  "pattern": "^(.+)$",
  "replacement": "${$1|lower}",
  "joinWith": "/"
}
```
`["Home","Women","Clothing","Tops"]` -> `home/women/clothing`.

## No-Match Behavior

- If no rule matches, by default the original input is returned (`returnOriginalOnNoMatch: true`).
- Invalid regex patterns are safely skipped and treated as no‑match.

## Stop on Match

- Set `stopOnMatch: true` on a rule to stop processing after it matches and transforms.

## Tips

- Keep transformations idempotent whenever possible.
- Prefer explicit `inputFieldPath` on the first rule to make inputs deterministic.
- Use `id` + `$rule_<id>` to compose multi‑step pipelines.

