import React from "react";
import { transformString } from "../common/utils/regex-transform";

const DEFAULT_URL =
  "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US";

const DEFAULT_RULES = [
  {
    description: "With lang: /s/:site/:slug/:id.html?lang=ll_CC → /ll-cc/:slug/:id.html",
    pattern: "^(https?://)?[^/]+/s/[^/]+/([^/]+)/([^/?#]+)\\.html\\?[^#]*\\blang=([a-zA-Z]{2})_([a-zA-Z]{2})\\b.*$",
    flags: "i",
    replacement: "/$4-$5/$2/$3.html",
  },
  {
    description: "No lang: default to en-us",
    pattern: "^(https?://)?[^/]+/s/[^/]+/([^/]+)/([^/?#]+)\\.html(?:\\?.*)?(?:#.*)?$",
    flags: "i",
    replacement: "/en-us/$2/$3.html",
  },
  {
    description: "Normalize locale underscore to hyphen (es_US → es-US)",
    pattern: "^/([a-zA-Z]{2})_([a-zA-Z]{2})/",
    flags: "i",
    replacement: "/$1-$2/",
  },
  {
    description: "Force lowercase locale (es-US → es-us, EN-us → en-us, etc.)",
    pattern: "^/(ES|Es|es)-(US|Us|us)/",
    flags: "i",
    replacement: "/es-us/",
  },
  {
    description: "Force lowercase locale (EN-us → en-us)",
    pattern: "^/(EN|En|en)-(US|Us|us)/",
    flags: "i",
    replacement: "/en-us/",
  },
];

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
  const [rulesText, setRulesText] = useLocalStorageState("rules", JSON.stringify(DEFAULT_RULES, null, 2));

  // Parse rules safely; memoized
  const { parsedRules, rulesError } = React.useMemo(() => {
    try {
      const parsed = JSON.parse(rulesText);
      if (!Array.isArray(parsed)) throw new Error("Rules must be an array.");
      return { parsedRules: parsed as any[], rulesError: null as string | null };
    } catch (e: any) {
      return { parsedRules: null, rulesError: e?.message ?? "Invalid JSON" };
    }
  }, [rulesText]);

  // Derive result (pure computation → no setState loops)
  const result = React.useMemo(() => {
    if (!parsedRules) return "⚠️ Invalid rules JSON";
    try {
      return `Transformed URL: ${transformString(url, parsedRules)}`;
    } catch (e) {
      console.error("Error during transformation:", e);
      return "⚠️ Error running transformation";
    }
  }, [url, parsedRules]);

  return (
    <div>
      <h2>Test URL Transform</h2>
      <p>This is a test component for URL transformation.</p>

      <textarea
        rows={30}
        name="rules"
        placeholder="Enter transformation rules"
        onChange={(e) => setRulesText(e.target.value)}
        value={rulesText}
        style={{ width: "100%", fontFamily: "monospace" }}
      />

      <input
        type="text"
        placeholder="Enter URL"
        onChange={(e) => setUrl(e.target.value)}
        value={url}
        style={{ width: "100%", marginTop: 12 }}
      />

      {rulesError && (
        <div role="alert" style={{ color: "#b00", marginTop: 8 }}>
          JSON error: {rulesError}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <strong>RESULT: {result}</strong>
      </div>
    </div>
  );
};

export default TestUrlTransform;
