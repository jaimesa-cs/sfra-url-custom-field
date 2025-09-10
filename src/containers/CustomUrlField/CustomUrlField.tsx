import React, { useCallback, useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";

import { useAppSdk } from "../../common/hooks/useAppSdk";

import "@contentstack/venus-components/build/main.css";
import { transformString } from "../../common/utils/regex-transform";
import { ToggleSwitch, Info, Icon } from "@contentstack/venus-components";
import "./CustomUrlField.css";

const CustomUrlFieldExtension = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();
  const [slug, setSlug] = useState<string>("");
  const [autoUrl, setAutoUrl] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const ref = React.useRef<HTMLDivElement>(null);

  const updateFieldValue = useCallback(
    (url: string, auto: boolean) => {
      console.log("Updating field value:", { url, auto });
      if (appSdk?.location?.CustomField) {
        appSdk.location.CustomField.field
          .setData({
            url,
            autoUrl: auto,
          })
          .then(() => {
            //TODO: IMPLEMENT TOAST
            console.log("Field value updated successfully");
          })
          .catch((e) => {
            console.error("Error updating field value:", e);
          });
      }
    },
    [appSdk]
  );

  React.useEffect(() => {
    if (!appSdk?.location?.CustomField || !appConfig?.app_configuration) return;
    console.log("Initial autoUrl value: ", appSdk?.location?.CustomField.field.getData()?.autoUrl);
    if (Object.keys(appSdk?.location?.CustomField?.entry.getData()).length === 0) {
      setIsEnabled(false);
      setWarningMessage("No entry data available. Please save the entry first.");
      setIsLoading(false);
      return;
    }
    const customField = appSdk.location.CustomField;
    const fieldData = customField.field.getData();
    if (customField.frame) {
      if (warningMessage !== null) {
        customField.frame.updateHeight(100);
      } else {
        customField.frame.updateHeight(110);
      }
    }

    setAutoUrl(fieldData?.autoUrl ?? false);

    // Helper to safely resolve deep paths like "product.data[0].slugUrl"
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

    // Resolve rules for this entry, supporting config by content type key
    const resolveRules = (cfg: any, newData: any): any[] => {
      if (!cfg) return [];
      if (customField?.entry?.content_type?.uid) {
        const typeUid = customField.entry.content_type.uid;
        const byType = cfg[typeUid];
        if (Array.isArray(byType)) return byType;
        if (byType?.rules && Array.isArray(byType.rules)) return byType.rules;
      }
      return [];
    };

    // Evaluate initial state for enable/warning using current entry data
    const initData = customField.entry.getData() || {};
    const initRules: any[] = resolveRules(appConfig?.app_configuration, initData);

    if (initRules.length > 0) {
      setIsEnabled(true);
      setWarningMessage(null);
    } else {
      setIsEnabled(false);
      setWarningMessage("No configuration found for this content type. Disabling automatic URL generation.");
      updateFieldValue("", false);
      return;
    }

    customField.entry.onChange(async () => {
      const newData = await customField?.entry.getDraftData();
      console.log("Entry data changed:", newData);
      if (!newData) {
        return;
      }
      const autoUrlEnabled = newData?.custom_url?.autoUrl;
      if (!autoUrlEnabled) {
        console.log("Auto URL generation is disabled.");
        return;
      }
      setIsLoading(true);
      const cfg = appConfig?.app_configuration;
      const rules = resolveRules(cfg, newData);

      // Determine initial input for the pipeline:
      // Prefer the first rule that declares an inputFieldPath
      const firstInputPath = rules.find((r) => typeof r?.inputFieldPath === "string")?.inputFieldPath;
      const fallbackPath = "product.data[0].slugUrl";
      const initialPath = firstInputPath || fallbackPath;
      const inputValue = getValueAtPath(newData, initialPath);

      let newSlug = inputValue;

      if (rules.length > 0) {
        setIsEnabled(true);
        setWarningMessage(null);
      } else {
        setIsEnabled(false);
        setWarningMessage("No configuration found for this content type. Disabling automatic URL generation.");
      }
      if (autoUrlEnabled) {
        console.log("Auto URL generation is enabled, transform!");
        newSlug = transformString(String(inputValue), rules, { context: newData });
        if (newSlug !== undefined) {
          setSlug(newSlug);
          customField?.entry.getField("url")?.setData(newSlug);
        }
      }
      setIsLoading(false);
    });
  }, [appSdk, appConfig, warningMessage]);

  return !appConfig ? (
    <>Loading...</>
  ) : (
    <div className="layout-container" id="url-root" ref={ref}>
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  {!warningMessage && (
                    <>
                      <div className="toggle-row">
                        <ToggleSwitch
                          label="Apply URL Pattern Automatically"
                          checked={autoUrl}
                          disabled={!isEnabled}
                          onChange={() => {
                            setAutoUrl(() => {
                              updateFieldValue(slug, !autoUrl);
                              return !autoUrl;
                            });
                          }}
                        />
                      </div>

                      <Info
                        version="v2"
                        type="light"
                        icon={<Icon icon="InformationCircle" />}
                        content={
                          "This extension allows editors to apply a URL pattern automatically into the entry's URL field by switching the toggle above."
                        }
                      />
                    </>
                  )}
                  {warningMessage && (
                    <Info version="v2" type="warning" icon={<Icon icon="WarningBold" />} content={warningMessage} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomUrlFieldExtension;
