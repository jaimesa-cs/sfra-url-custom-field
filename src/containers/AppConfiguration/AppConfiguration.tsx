import React, { useRef, useState } from "react";
import Icon from "../../assets/GearSix.svg";
import localeTexts from "../../common/locales/en-us/index";
import styles from "./AppConfiguration.module.css";
import { useInstallationData } from "../../common/hooks/useInstallationData";
import Tooltip from "../Tooltip/Tooltip";

import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { Button, Accordion } from "@contentstack/venus-components";
import { transformString } from "../../common/utils/regex-transform";

const sampleConfig = {
  plp: [
    {
      inputFieldPath: "product.data[0].slugUrl",
      id: "rule_1",
      description: "Product to /p/:id",
      pattern: "^https?://[^/]+/product/(\\d+)(?:\\?.*)?$",
      replacement: "/p/$1",
    },
    {
      id: "rule_2",
      description: "Drop all utm params",
      pattern: "(\\?|&)(utm_[^=]+=[^&#]*)",
      flags: "gi",
      replacement: "",
      stopOnMatch: false,
    },
    // Example of building from map and referencing ids in input/pattern
    // {
    //   id: "rule_3",
    //   fromMap: true,
    //   input: "/$rule_1/$rule_2/file.html",
    //   description: "Build composite path from map",
    //   pattern: "^(.*)$",
    //   flags: "i",
    //   replacement: "/en-us/${$1|lower}",
    //   stopOnMatch: false,
    // },
  ],
};

export const setStatus = StateEffect.define<{ text: string; level?: "info" | "warn" | "error" | "success" } | null>();
type StatusData = { text: string; level: "info" | "warn" | "error" | "success" } | null;

const AppConfigurationExtension: React.FC = () => {
  const { installationData, setInstallationData } = useInstallationData();
  const editorRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [code, setCode] = useState<string>(JSON.stringify(sampleConfig, null, 2));
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  // Playground state
  const [playEntry, setPlayEntry] = useState<string>(
    JSON.stringify(
      {
        product: {
          data: [
            {
              slugUrl:
                "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US",
            },
          ],
        },
      },
      null,
      2
    )
  );
  const [playContentType, setPlayContentType] = useState<string>("plp");
  const [playMap, setPlayMap] = useState<Record<string, string>>({});
  const [playResult, setPlayResult] = useState<string>("");

  const updateConfig = React.useCallback(
    async (value: any) => {
      if (typeof setInstallationData !== "undefined") {
        console.log("Updating configuration with value:", value);
        setInstallationData({
          configuration: {
            sfra_app_configuration: value,
          },
          serverConfiguration: {},
        });
      }
    },
    [setInstallationData]
  );

  const isValidJson = (value: any) => {
    try {
      if (typeof value !== "string") return false;
      JSON.parse(value);

      return true;
    } catch {
      return false;
    }
  };

  React.useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    // simple debounce util
    let validateTid: any = null;
    const validateOnly = (value: string) => {
      if (validateTid) clearTimeout(validateTid);
      validateTid = setTimeout(() => {
        const valid = isValidJson(value);
        console.log("Validating JSON:", value, ", is valid: ", valid);
        if (statusRef.current) {
          statusRef.current.textContent = valid ? "✓ JSON is valid" : "✗ JSON is invalid";
        }
        setIsJsonValid(valid);
      }, 200);
    };

    const onChangeExtension = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;

      const value = update.state.doc.toString();

      // 1) ALWAYS capture raw text so you never miss keystrokes
      setCode(value);

      // 2) Validate only (do not save) with debounce
      validateOnly(value);
    });

    viewRef.current = new EditorView({
      state: EditorState.create({
        doc: JSON.stringify(installationData?.configuration?.sfra_app_configuration ?? code, null, 2),
        extensions: [basicSetup, json(), onChangeExtension],
      }),
      parent: editorRef.current,
    });

    return () => {
      if (validateTid) clearTimeout(validateTid);
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [installationData, updateConfig]);

  const onSave = React.useCallback(() => {
    const current = code;
    const valid = isValidJson(current);
    if (!valid) {
      if (statusRef.current) statusRef.current.textContent = "✗ JSON is invalid";
      setIsJsonValid(false);
      return;
    }
    try {
      const parsed = JSON.parse(current);
      updateConfig(parsed);
      if (statusRef.current) statusRef.current.textContent = "✓ Configuration saved";
    } catch (e) {
      console.error("Failed to parse/save config:", e);
      if (statusRef.current) statusRef.current.textContent = "✗ Failed to save configuration";
    }
  }, [code, updateConfig]);

  // Resolve rules from current editor JSON for a given content type
  const resolveRulesFromCode = React.useCallback((raw: string, contentType: string): any[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") {
        const val = parsed[contentType];
        if (Array.isArray(val)) return val;
        if (val?.rules && Array.isArray(val.rules)) return val.rules;
        const firstKey = Object.keys(parsed)[0];
        const firstVal = firstKey ? parsed[firstKey] : undefined;
        if (Array.isArray(firstVal)) return firstVal;
        if (firstVal?.rules && Array.isArray(firstVal.rules)) return firstVal.rules;
      }
    } catch {
      console.warn("[TestUrlTransform] Invalid JSON in editor");
      return [];
    }
    return [];
  }, []);

  const runPlayground = React.useCallback(() => {
    try {
      const rules = resolveRulesFromCode(code, playContentType);
      const entryObj = JSON.parse(playEntry || "{}");
      // Determine initial input: first rule with inputFieldPath
      const firstPath = rules.find((r: any) => typeof r?.inputFieldPath === "string")?.inputFieldPath;
      const fallbackPath = "product.data[0].slugUrl";
      const getValueAtPath = (root: any, path: string): any => {
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
      };
      const initialInput = getValueAtPath(entryObj, firstPath || fallbackPath) ?? "";
      let lastMap: Record<string, string> = {};
      const out = transformString(String(initialInput), rules, {
        context: entryObj,
        collectMap: (m) => (lastMap = m),
      });
      setPlayMap(lastMap);
      setPlayResult(out);
    } catch (e) {
      setPlayMap({});
      setPlayResult("Error running preview");
    }
  }, [code, playContentType, playEntry, resolveRulesFromCode]);

  return (
    <div className={`${styles.layoutContainer}`}>
      <div className={`${styles.appConfig}`}>
        <div className={`${styles.appConfigLogoContainer}`}>
          <img src={Icon} alt="icon" />
          <p>{localeTexts.ConfigScreen.title}</p>
        </div>

        <div className={`${styles.configWrapper}`}>
          <div className={`${styles.configContainer}`}>
            <div className={`${styles.infoContainerWrapper}`}>
              <div className={`${styles.infoContainer}`}>
                <div className={`${styles.labelWrapper}`}>
                  <label htmlFor="appConfigData">Transform Rules</label>
                  <Tooltip content="Provide the correct transform rules for your URLs" />
                </div>
              </div>
              <div className={`${styles.inputContainer}`}>
                <div ref={editorRef} className={styles.editorFrame} />
                <div className={styles.actionsRow}>
                  <div ref={statusRef} className={styles.statusBar}>
                    Configuraiton Loaded!
                  </div>
                  <Button onClick={onSave} disabled={!isJsonValid}>
                    Save configuration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.playground}>
          <Accordion title="Transform Playground" expanded={false}>
            <div className={styles.playgroundRow}>
              <div className={styles.playgroundCol}>
                <label htmlFor="entryJson">Entry JSON</label>
                <textarea
                  id="entryJson"
                  className={styles.textArea}
                  rows={14}
                  value={playEntry}
                  onChange={(e) => setPlayEntry(e.target.value)}
                />
              </div>
              <div className={styles.playgroundCol}>
                <div className={styles.inputContainer}>
                  <div className={styles.labelWrapper}>
                    <label htmlFor="contentType">Content Type Key</label>
                  </div>
                  <input
                    id="contentType"
                    className={styles.textInput}
                    value={playContentType}
                    onChange={(e) => setPlayContentType(e.target.value)}
                  />
                  <div className={styles.actionsRow}>
                    <div className={styles.statusBar}>Preview runs on current editor JSON</div>
                    <Button onClick={runPlayground} disabled={!isJsonValid}>
                      Run preview
                    </Button>
                  </div>
                </div>

                <div className={styles.inputContainer} style={{ marginTop: 12 }}>
                  <div className={styles.labelWrapper}>
                    <label>Outputs Map</label>
                  </div>
                  <textarea className={styles.textArea} rows={10} readOnly value={JSON.stringify(playMap, null, 2)} />
                </div>

                <div className={styles.inputContainer} style={{ marginTop: 12 }}>
                  <div className={styles.labelWrapper}>
                    <label>Transformed URL</label>
                  </div>
                  <div className={styles.resultBox}>{playResult || "(empty)"}</div>
                </div>
              </div>
            </div>
          </Accordion>
        </div>
        {/* 
        <div className={`${styles.locationDescription}`}>
          <p className={`${styles.locationDescriptionText}`}>{parse(localeTexts.ConfigScreen.body)}</p>
          <a target="_blank" rel="noreferrer" href={localeTexts.ConfigScreen.button.url}>
            <span className={`${styles.locationDescriptionLink}`}>{localeTexts.ConfigScreen.button.text}</span>
          </a>
        </div> */}
      </div>
    </div>
  );
};

export default AppConfigurationExtension;
