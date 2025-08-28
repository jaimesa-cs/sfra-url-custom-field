import React from "react";
import { transformString } from "../common/utils/regex-transform";
import "./TestUrlTransform.css";

const DEFAULT_URL =
  "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US";

const DEFAULT_RULES = {
  plp: [
  {
    inputFieldPath: "product.data[0].slugUrl",
    id: "rule_1",
    description: "Strip host + site → keep path/id (supports optional query)",
    pattern: "^(?:https?://)?[^/]+/s/[^/]+/([^?#]+)(?:\\?[^#]*)?$",
    flags: "i",
    replacement: "/$1",
  },
    // {
    //   id: "rule_3",
    //   fromMap: true,
    //   input: "/$rule_1",
    //   description: "Prefix locale",
    //   pattern: "^(.*)$",
    //   replacement: "/en-us/${$1|lower}",
    //   stopOnMatch: false,
    // },
  ],
};
const DEFAULT_ENTRY = {
  product: {
    data: [
      {
        slugUrl:
          "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US",
      },
    ],
  },
};

// ---- localStorage-backed state (SSR-safe)
function useLocalStorageState(key: string, initialValue: string) {
  const [value, setValue] = React.useState<string>(() => {
    if (typeof window === "undefined") return initialValue;
    const stored = window.localStorage.getItem(key);
    return stored ?? initialValue;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

const TestUrlTransform = () => {
  // Load from LS or fall back to defaults (runs only once via lazy init)
  const [url, setUrl] = useLocalStorageState("url", DEFAULT_URL);
  const [contentType, setContentType] = useLocalStorageState("contentType", "plp");
  const [rulesText, setRulesText] = useLocalStorageState("rules", JSON.stringify(DEFAULT_RULES, null, 2));
  const [entryText, setEntryText] = useLocalStorageState("entry", JSON.stringify(DEFAULT_ENTRY, null, 2));

  // Parse rules safely; memoized
  const { parsedRoot, rulesError } = React.useMemo(() => {
    try {
      const parsed = JSON.parse(rulesText);
      return { parsedRoot: parsed, rulesError: null as string | null };
    } catch (e: any) {
      return { parsedRoot: null, rulesError: e?.message ?? "Invalid JSON" };
    }
  }, [rulesText]);

  const entry = React.useMemo(() => {
    try {
      return JSON.parse(entryText);
    } catch {
      return {};
    }
  }, [entryText]);

  // Helper to safely resolve deep paths like "product.data[0].slugUrl"
  const getValueAtPath = React.useCallback((root: any, path: string): any => {
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
  }, []);

  // Derive result and map (pure computation → no setState loops)
  const { result, mapJson } = React.useMemo(() => {
    if (!parsedRoot) {
      console.warn("[TestUrlTransform] Invalid rules JSON");
      return { result: "⚠️ Invalid rules JSON", mapJson: "{}" };
    }
    let rulesArr: any[] | null = null;
    const root = parsedRoot as any;
    console.log("[TestUrlTransform] parsedRoot:", root);
    if (Array.isArray(root)) {
      rulesArr = root;
    } else if (root && typeof root === "object") {
      const val = root[contentType];
      if (Array.isArray(val)) rulesArr = val;
      else if (val && Array.isArray(val.rules)) rulesArr = val.rules;
      if (!rulesArr) {
        const firstKey = Object.keys(root)[0];
        const firstVal = firstKey ? root[firstKey] : undefined;
        if (Array.isArray(firstVal)) rulesArr = firstVal;
        else if (firstVal && Array.isArray(firstVal.rules)) rulesArr = firstVal.rules;
      }
    }
    if (!Array.isArray(rulesArr)) {
      console.warn("[TestUrlTransform] No rules found for contentType:", contentType);
      return { result: "⚠️ No rules found", mapJson: "{}" };
    }
    try {
      const firstInputPath = rulesArr.find((r: any) => typeof r?.inputFieldPath === "string")?.inputFieldPath;
      const fallbackPath = "product.data[0].slugUrl";
      const initialPath = firstInputPath || fallbackPath;
      const initialInput = getValueAtPath(entry, initialPath) ?? url;
      console.log("[TestUrlTransform] rules selected:", rulesArr);
      console.log("[TestUrlTransform] initialPath:", initialPath);
      console.log("[TestUrlTransform] initialInput:", initialInput);
      let lastMap: Record<string, string> = {};
      const out = transformString(String(initialInput), rulesArr as any[], {
        context: entry,
        onRuleEvaluated: ({ rule, input, pattern, replacement, matched }) => {
          console.log(
            "[Transform:onRuleEvaluated]",
            rule.id || rule.description || rule.pattern,
            { input, pattern, replacement, matched }
          );
        },
        onMatch: (rule, before, after) => {
          const tag = rule.id || rule.description || rule.pattern;
          console.log("[Transform:onMatch]", tag, { before, after });
        },
        collectMap: (m) => (lastMap = m),
      });
      console.log("[TestUrlTransform] outputsMap:", lastMap);
      console.log("[TestUrlTransform] final output:", out);
      return { result: out, mapJson: JSON.stringify(lastMap, null, 2) };
    } catch (e) {
      console.error("[TestUrlTransform] Error during transformation:", e);
      return { result: "⚠️ Error running transformation", mapJson: "{}" };
    }
  }, [url, parsedRoot, entry, getValueAtPath, contentType]);

  return (
    <div className="test-layout-container">
      <div className="test-card">
        <div className="test-header">
          <h2>Test URL Transform</h2>
          <p>Use rules and entry JSON to simulate transformations.</p>
        </div>

        <div className="test-section">
          <label className="test-label" htmlFor="contentType">Content Type Key</label>
          <input
            id="contentType"
            className="test-input"
            type="text"
            placeholder="e.g. plp, pdp..."
            onChange={(e) => setContentType(e.target.value)}
            value={contentType}
          />
        </div>

        {/* Entry JSON at the top */}
        <div className="test-section">
          <label className="test-label" htmlFor="entry">
            Entry JSON (context)
          </label>
          <textarea
            id="entry"
            className="test-textarea"
            rows={16}
            name="entry"
            placeholder="Entry JSON (used as context for inputFieldPath)"
            onChange={(e) => setEntryText(e.target.value)}
            value={entryText}
          />
        </div>

        {/* Side-by-side rules and outputs map */}
        <div className="test-row">
          <div className="test-col">
            <div className="test-section">
              <label className="test-label" htmlFor="rules">
                Rules JSON
              </label>
              <textarea
                id="rules"
                className="test-textarea"
                rows={16}
                name="rules"
                placeholder="Enter transformation rules"
                onChange={(e) => setRulesText(e.target.value)}
                value={rulesText}
              />
            </div>
          </div>
          <div className="test-col">
            <div className="test-section">
              <label className="test-label" htmlFor="map">
                Outputs Map
              </label>
              <textarea id="map" className="test-textarea" rows={16} name="map" readOnly value={mapJson} />
            </div>
          </div>
        </div>

        <div className="test-section">
          <label className="test-label" htmlFor="url">
            URL (fallback input)
          </label>
          <input
            id="url"
            className="test-input"
            type="text"
            placeholder="Enter URL"
            onChange={(e) => setUrl(e.target.value)}
            value={url}
          />
        </div>

        {rulesError && (
          <div role="alert" className="test-alert">
            JSON error: {rulesError}
          </div>
        )}

        <div className="test-result">Transformed URL: {result}</div>
      </div>
    </div>
  );
};

export default TestUrlTransform;
