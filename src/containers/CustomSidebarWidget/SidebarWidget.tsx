import React, { useCallback } from "react";
import { Button, Info, Icon } from "@contentstack/venus-components";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import { useAppSdk } from "../../common/hooks/useAppSdk";
import { transformString } from "../../common/utils/regex-transform";
import "@contentstack/venus-components/build/main.css";
import "./SidebarWidget.css";

const SidebarWidget: React.FC = () => {
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();

  const [, setInitialInput] = React.useState<string>("");
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isEnabled, setIsEnabled] = React.useState<boolean>(false);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  const updateFieldValue = useCallback(
    (url: string) => {
      if (appSdk?.location?.SidebarWidget) {
        appSdk.location.SidebarWidget.entry
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
      const typeUid = appSdk?.location?.SidebarWidget?.entry?.content_type?.uid;

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
    console.log(warningMessage);
    if (appConfig && appSdk?.location?.SidebarWidget) {
      const rules = resolveRules(appConfig?.app_configuration);

      if (rules.length > 0) {
        setIsEnabled(true);
        setWarningMessage(null);
      } else {
        setIsEnabled(false);
        setWarningMessage(
          "No configuration found for this content type. for the current content type: " +
            appSdk?.location?.SidebarWidget?.entry?.content_type?.uid || ""
        );
      }
      setIsLoading(false);
      console.log("SidebarWidget config", rules);
    }
  }, [appConfig, appSdk]);

  const runTransform = React.useCallback(() => {
    if (!appSdk || !appConfig?.app_configuration || !appSdk?.location?.SidebarWidget) return;
    setIsRunning(true);
    try {
      const cfg = appConfig.app_configuration;
      const rules = resolveRules(cfg);

      if (rules.length === 0) {
        setIsRunning(false);
        setWarningMessage("No transformation rules to process");
        return;
      }

      const entryData = appSdk.location.SidebarWidget.entry.getData() || {};
      const firstInputPath = rules.find((r: any) => typeof r?.inputFieldPath === "string")?.inputFieldPath;
      const fallbackPath = "product.data[0].slugUrl";
      const initialPath = firstInputPath || fallbackPath;
      const baseInput = getValueAtPath(entryData, initialPath) ?? "";

      setInitialInput(String(baseInput));
      const out = transformString(String(baseInput), rules, { context: entryData });
      updateFieldValue(out);
      setWarningMessage(null);
    } catch (e) {
      // Silent fail to UI state
    } finally {
      setIsRunning(false);
    }
  }, [appConfig, getValueAtPath, resolveRules]);

  return !appConfig || isLoading ? null : (
    <div className="layout-container" id="field-mod-root">
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              {!warningMessage && (
                <>
                  <div className="button-row">
                    <Button onClick={runTransform} disabled={isRunning || !isEnabled}>
                      {isRunning ? "Applying..." : "Apply URL"}
                    </Button>
                  </div>

                  <Info
                    version="v2"
                    type="light"
                    icon={<Icon icon="InformationCircle" />}
                    content={
                      "This extension allows editors to apply a URL pattern directly into the entry's URL fieldby clicking the button above."
                    }
                  />
                </>
              )}
              {warningMessage && (
                <Info version="v2" type="warning" icon={<Icon icon="WarningBold" />} content={warningMessage} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarWidget;
