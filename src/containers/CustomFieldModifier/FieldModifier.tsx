import React, { useCallback } from "react";
import { Button, Info, Icon } from "@contentstack/venus-components";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useAppSdk } from "../../common/hooks/useAppSdk";
import { transformString } from "../../common/utils/regex-transform";

import "@contentstack/venus-components/build/main.css";
import "./FieldModifier.css";

const FieldModifier: React.FC = () => {
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();

  const [, setInitialInput] = React.useState<string>("");
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isEnabled, setIsEnabled] = React.useState<boolean>(false);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

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
    (cfg: any): any[] => {
      if (!cfg) return [];
      const typeUid = appSdk?.location?.FieldModifierLocation?.entry?.content_type?.uid;

      if (typeUid) {
        const byType = cfg[typeUid];

        if (Array.isArray(byType)) return byType;
        if (Array.isArray(byType?.rules)) return byType.rules;
      }
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
    console.log("useEffect::FieldModifier");
    if (appConfig && appSdk?.location?.FieldModifierLocation) {
      const frame = appSdk.location.FieldModifierLocation.frame;
      let width = 500;
      let height = 75;
      if (appSdk?.location?.FieldModifierLocation?.field.schema.uid !== "url") {
        setWarningMessage("This modifier is only available on 'url' fields.");
        frame.updateDimension({ height, width });
        setIsLoading(false);
        setIsEnabled(false);
        return;
      }
      frame.updateDimension({ height, width });
      const rules = resolveRules(appConfig?.app_configuration);

      if (rules.length > 0) {
        width = 500;
        height = 180;
        frame.updateDimension({ height, width });
        setIsEnabled(true);
        setWarningMessage(null);
      } else {
        frame.updateDimension({ height, width });
        setWarningMessage("No configuration found for this content type.");
      }
      setIsLoading(false);
      //   frame.disableAutoResizing();
    } else {
      setWarningMessage("Unable to load extension.");
    }
  }, [appConfig, appSdk]);

  const runTransform = React.useCallback(() => {
    if (!appSdk || !appConfig?.app_configuration || !appSdk?.location?.FieldModifierLocation) return;
    setIsRunning(true);
    try {
      const cfg = appConfig.app_configuration;
      const entryData = appSdk.location.FieldModifierLocation.entry.getData() || {};
      const rules = resolveRules(cfg);
      const firstInputPath = rules.find((r: any) => typeof r?.inputFieldPath === "string")?.inputFieldPath;
      const fallbackPath = "product.data[0].slugUrl";
      const initialPath = firstInputPath || fallbackPath;
      const baseInput = getValueAtPath(entryData, initialPath) ?? "";
      setInitialInput(String(baseInput));

      if (rules.length === 0) {
        setIsRunning(false);
        setWarningMessage("No configuration found for this content type.");
        return;
      }
      const out = transformString(String(baseInput), rules, { context: entryData });
      updateFieldValue(out);
      setWarningMessage(null);
    } catch (e) {
      // Silent fail to UI state
    } finally {
      setIsRunning(false);
    }
  }, [appConfig, getValueAtPath, resolveRules]);

  return (
    <>
      {!appConfig || isLoading ? null : (
        <div className="layout-container" id="field-mod-root">
          <div className="ui-location-wrapper">
            <div className="ui-location">
              <div className="input-wrapper">
                <div className="input-container">
                  {isEnabled && (
                    <Info
                      version="v2"
                      type="light"
                      icon={<Icon icon="InformationCircle" />}
                      content={
                        "This extension allows editors to apply a URL pattern directly into the entry's URL field by clicking the button below."
                      }
                    />
                  )}
                  {warningMessage && (
                    <Info version="v2" type="warning" icon={<Icon icon="WarningBold" />} content={warningMessage} />
                  )}
                  {!warningMessage && appSdk?.location?.FieldModifierLocation?.field.schema.uid === "url" && (
                    <div className="button-row">
                      <Button variant="secondary" onClick={runTransform} disabled={isRunning || !isEnabled}>
                        {isRunning ? "Applying..." : "Apply URL Pattern"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FieldModifier;
