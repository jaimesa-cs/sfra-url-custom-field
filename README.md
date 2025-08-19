# Contentstack Marketplace App Boilerplate

## Provider

`<MarketplaceAppProvider>`

This provider is responsible for the following actions

- Initialize the contentstack SDK
- Make the SDK instance available via hooks to avoid props drilling
- Set global properties for Analytics and Error tracking
- Send "App Initialized / Failed" event

## Available Hooks

- useAppConfig
- useAppLocation
- useAppSdk
- useCustomField
- useEntry
- useFrame
- useHostUrl
- useInstallationData
- useSdkDataByPath

## Routes

Each route represents one location. It is recommended to lazy load the route components to reduce the bundle
size.

#### Adding new route

- Create a new Route component inside route. Use default export
  - Inside `App.tsx`, lazy load the route component.
    - eg: `const CustomFieldExtension = React.lazy(() => import("./routes/CustomField"))`
  - Add the route wrapped inside `Suspense`.
    - Eg: ` <Route path="/new" element={<Suspense><CustomFieldExtension /></Suspense>} />`

## Testing

- All e2e test files are stored in e2e folder
- Create a `.env` file in the root directory & add environment variables as shown in `.env.sample` file.
- Please refer the below commands to run e2e tests locally and setup the perquisites before running them.
- `Note`: To run the below commands make sure the app is running in the background i.e on port `http://localhost:3000`

  ```
    "test:chrome": "npx playwright test --config=playwright.config.ts --project=Chromium",
    "test:firefox": "npx playwright test --config=playwright.config.ts --project=firefox",
    "test:chrome-headed": "npx playwright test --headed --config=playwright.config.ts --project=Chromium",
    "test:firefox-headed": "npx playwright test --headed --config=playwright.config.ts --project=firefox"
  ```

- Unit & integration tests are stored in `src/__tests__` folder
- run `npm run test` to run unit and integration tests

## Styling

- This setup uses basic CSS for styling

## Reference to documentation

- [Marketplace App Boilerplate](https://www.contentstack.com/docs/developers/developer-hub/marketplace-app-boilerplate/)

# Regex Transform Engine

This utility provides a simple, configurable way to transform input strings (such as URLs) into output strings using regular expressions.  
It supports:

- Regex **patterns** with capture groups (numbered or named).
- **Replacements** using `$1`, `$2`, `$<name>`, hardcoded values, or empty strings.
- **Chaining rules** (apply multiple transformations in sequence).
- Configurable behavior for unmatched inputs.

---

## Installation

```bash
# If using TypeScript or ES modules
import { transformString, TransformRule } from "./regex-transform";
```

```
type TransformRule = {
  pattern: string;        // Regex as a string
  flags?: string;         // Regex flags, e.g. "i", "g"
  replacement: string;    // Replacement template ("$1", "$<name>", or literal text)
  stopOnMatch?: boolean;  // Stop after first match (default: true)
  description?: string;   // Optional description for debugging
};
```

### Convert full product URL to short path

```const rules: TransformRule[] = [
  {
    description: "Product page → short /p/:id",
    pattern: "^https?://[^/]+/product/(\\d+)(?:\\?.*)?$",
    replacement: "/p/$1",
  },
];

transformString("https://example.com/product/123?ref=abc", rules);
// → "/p/123"
```

### Strip tracking query params

```const rules: TransformRule[] = [
  {
    description: "Drop utm_* query params",
    pattern: "(\\?|&)(utm_[^=]+=[^&#]*)",
    flags: "gi",
    replacement: "",
    stopOnMatch: false, // keep going for multiple matches
  },
];

transformString(
  "https://ex.com/a/b?x=1&utm_source=foo&utm_medium=bar#frag",
  rules
);
// → "https://ex.com/a/b?x=1#frag"
```

### Re-map path segments with hardcoded text

```onst rules: TransformRule[] = [
  {
    description: "Map /category/:slug → /c/:slug",
    pattern: "^https?://[^/]+/category/([^/?#]+)",
    replacement: "/c/$1"
  }
];

transformString("https://shop.com/category/dresses?color=blue", rules);
// → "/c/dresses"
```

### Use named groups

```const rules: TransformRule[] = [
  {
    description: "Extract domain and keep only host",
    pattern: "^(?:https?://)?(?<host>[^/]+)(?:/.*)?$",
    flags: "i",
    replacement: "$<host>"
  }
];

transformString("https://sub.example.co.uk/path?q=1", rules);
// → "sub.example.co.uk"
```

### Chain multiple transformations

```const rules: TransformRule[] = [
  {
    description: "Normalize protocol-less",
    pattern: "^//",
    replacement: "https://",
    stopOnMatch: false
  },
  {
    description: "Collapse duplicate slashes (not after protocol)",
    pattern: "(?<!:)//+",
    flags: "g",
    replacement: "/",
    stopOnMatch: false
  },
  {
    description: "Remove trailing slash (except root)",
    pattern: "(.+)/$",
    replacement: "$1",
    flags: "g",
    stopOnMatch: false
  }
];

transformString("//example.com///foo///", rules);
// → "https://example.com/foo"
```

### JSON Configuration

Rules can be stored in JSON and loaded dynamically:

```
[
  {
    "description": "Product to /p/:id",
    "pattern": "^https?://[^/]+/product/(\\d+)(?:\\?.*)?$",
    "replacement": "/p/$1"
  },
  {
    "description": "Drop all utm params",
    "pattern": "(\\?|&)(utm_[^=]+=[^&#]*)",
    "flags": "gi",
    "replacement": "",
    "stopOnMatch": false
  }
]


Usage:

import rules from "./rules.json";
transformString("https://example.com/product/123?utm_source=foo", rules);
// → "/p/123"

```
