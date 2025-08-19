import React, { useRef, useState } from "react";
import Icon from "../../assets/GearSix.svg";
import localeTexts from "../../common/locales/en-us/index";
import styles from "./AppConfiguration.module.css";
import { useInstallationData } from "../../common/hooks/useInstallationData";
import Tooltip from "../Tooltip/Tooltip";

import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { set } from "lodash";

const sampleConfig = [
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
];

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
            sfra_app_configuration: {
              rules: value,
            },
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
        if (statusRef.current) {
          statusRef.current.textContent = valid ? "✓ JSON is valid" : "✗ JSON is invalid";
        }
        if (valid) {
          // call your side-effect when valid
          updateConfig(value);
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
        doc: installationData?.configuration?.sfra_app_configuration?.rules ?? JSON.stringify(sampleConfig, null, 2),
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
                <div ref={editorRef} style={{ border: "1px solid #ccc" }} />
                <div
                  ref={statusRef}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    borderTop: "1px solid #ccc",
                    background: "#f9f9f9",
                  }}
                />
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
