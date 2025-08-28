import React, { useRef, useState } from "react";
import Icon from "../../assets/GearSix.svg";
import localeTexts from "../../common/locales/en-us/index";
import styles from "./AppConfiguration.module.css";
import { useInstallationData } from "../../common/hooks/useInstallationData";
import Tooltip from "../Tooltip/Tooltip";

import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";

const sampleConfig = {
  inputFieldPath: "entry::product.data[0].slugUrl",
  rules: [
    {
      description: "Product to /p/:id",
      pattern: "^https?://[^/]+/product/(\\d+)(?:\\?.*)?$",
      replacement: "/p/$1",
    },
    {
      description: "Drop all utm params",
      pattern: "(\\?|&)(utm_[^=]+=[^&#]*)",
      flags: "gi",
      replacement: "",
      stopOnMatch: false,
    },
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
    const validateAndMaybeUpdate = (value: string) => {
      if (validateTid) clearTimeout(validateTid);
      validateTid = setTimeout(() => {
        const valid = isValidJson(value);
        console.log("Validating JSON:", value, ", is valid: ", valid);
        if (statusRef.current) {
          statusRef.current.textContent = valid ? "✓ JSON is valid" : "✗ JSON is invalid";
        }
        if (valid) {
          // call your side-effect when valid
          updateConfig(JSON.parse(value));
        }
      }, 200);
    };

    const onChangeExtension = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;

      const value = update.state.doc.toString();

      // 1) ALWAYS capture raw text so you never miss keystrokes
      setCode(value);

      // 2) Validate and (if valid) push to your store, debounced
      validateAndMaybeUpdate(value);
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
                <div
                  ref={editorRef}
                  style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", borderRadius: "8px" }}
                />
                <div
                  ref={statusRef}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    borderTop: "1px solid #ccc",
                    background: "#f9f9f9",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    borderRadius: "8px",
                  }}
                >
                  Configuraiton Loaded!
                </div>
              </div>
            </div>
            <div className={`${styles.descriptionContainer}`}>
              <p>Use this field to share non-sensitive configurations of your app with other locations.</p>
            </div>
          </div>
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
