import React from "react";
import { transformString } from "../common/utils/regex-transform";

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
    replacement: "/en-us/$1/$2.html",
  },
  {
    description: "Normalize locale casing (es_US → es-us)",
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
const TestUrlTransform = () => {
  const [url, setUrl] = React.useState(
    "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US"
  );
  const [result, setResult] = React.useState("");
  const [rules, setRules] = React.useState(JSON.stringify(DEFAULT_RULES, null, 2));

  React.useEffect(() => {
    // Simulate a URL transformation
    const r = transformString(url, JSON.parse(rules || "[]"));
    setResult(`Transformed URL: ${r}`);
  }, [url]);

  return (
    <div>
      <h2>Test URL Transform</h2>
      <p>This is a test component for URL transformation.</p>
      <textarea
        rows={30}
        name="rules"
        placeholder="Enter transformation rules"
        onChange={(e) => setRules(e.target.value)}
        value={rules}
      ></textarea>
      <input type="text" placeholder="Enter URL" onChange={(e) => setUrl(e.target.value)} value={url} />
      <br />
      <br />
      <br />
      <div>
        <strong>RESULT: {result}</strong>
      </div>
    </div>
  );
};

export default TestUrlTransform;
