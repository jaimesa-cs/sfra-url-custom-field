import React, { useCallback } from "react";
import { Button } from "@contentstack/venus-components";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useAppSdk } from "../../common/hooks/useAppSdk";
import { transformString } from "../../common/utils/regex-transform";
import { useAppLocation } from "../../common/hooks/useAppLocation";
import "@contentstack/venus-components/build/main.css";
import "./SfraFieldModifier.css";
import { set } from "lodash";

const SfraFieldModifier: React.FC = () => {
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();
  const { location } = useAppLocation();

  const [, setInitialInput] = React.useState<string>("");
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const updateFieldValue = useCallback(
    (url: string) => {
      if (appSdk?.location?.FieldModifierLocation) {
        appSdk.location.FieldModifierLocation.entry
          .getField("url")
          .setData(url)
          .catch((e) => {
            console.error("Error updating field value:", e);
          });
      }
    },
    [appSdk]
  );

  // Resolve rules array from configuration (supports array or keyed by content type)
  const resolveRules = React.useCallback(
    (cfg: any, entryData: any): any[] => {
      if (!cfg) return [];
      if (Array.isArray(cfg)) return cfg;
      if (Array.isArray(cfg?.rules)) return cfg.rules;
      const typeUid = appSdk?.location?.FieldModifierLocation?.entry?.content_type?.uid;
      if (typeUid) {
        const byType = cfg[typeUid];
        if (Array.isArray(byType)) return byType;
        if (Array.isArray(byType?.rules)) return byType.rules;
      }
      const firstKey = Object.keys(cfg || {})[0];
      const firstVal = firstKey ? cfg[firstKey] : undefined;
      if (Array.isArray(firstVal)) return firstVal;
      if (Array.isArray(firstVal?.rules)) return firstVal.rules;
      return [];
    },
    [appSdk]
  );

  // Utility to resolve deep path like product.data[0].slugUrl
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

  React.useEffect(() => {
    if (appSdk?.location?.FieldModifierLocation) {
      const frame = appSdk.location.FieldModifierLocation.frame;
      let width = 178;
      if (appSdk?.location?.FieldModifierLocation?.field.schema.uid !== "url") {
        width = 350;
      }
      frame.updateDimension({ height: 60, width });
      setIsLoading(false);
      //   frame.disableAutoResizing();
    }
  }, [location]);

  const runTransform = React.useCallback(() => {
    console.log("Running transform...", appConfig?.sfra_app_configuration);
    if (!appSdk || !appConfig?.sfra_app_configuration || !appSdk?.location?.FieldModifierLocation) return;
    setIsRunning(true);
    try {
      const cfg = appConfig.sfra_app_configuration;
      const entryData = appSdk.location.FieldModifierLocation.entry.getData() || {};
      const rules = resolveRules(cfg, entryData);
      const firstInputPath = rules.find((r: any) => typeof r?.inputFieldPath === "string")?.inputFieldPath;
      const fallbackPath = "product.data[0].slugUrl";
      const initialPath = firstInputPath || fallbackPath;
      console.log("Using input path:", initialPath);
      const baseInput = getValueAtPath(entryData, initialPath) ?? "";
      setInitialInput(String(baseInput));

      if (!baseInput || !rules.length) {
        setIsRunning(false);
        console.warn("No input or rules to process");
        return;
      }
      const out = transformString(String(baseInput), rules, { context: entryData });
      updateFieldValue(out);
    } catch (e) {
      // Silent fail to UI state
    } finally {
      setIsRunning(false);
    }
  }, [appConfig, getValueAtPath, resolveRules]);

  return !appConfig || isLoading ? null : (
    <div className="layout-container" id="sfra-field-mod-root">
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              <div className="button-row">
                {appSdk?.location?.FieldModifierLocation?.field.schema.uid === "url" ? (
                  <Button onClick={runTransform} disabled={isRunning}>
                    {isRunning ? "Applying..." : "Apply SFRA URL"}
                  </Button>
                ) : (
                  <p>This modifier only works on the &apos;url&apos; field.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SfraFieldModifier;
