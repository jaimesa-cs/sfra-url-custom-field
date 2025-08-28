import React, { useCallback, useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";

import { useAppSdk } from "../../common/hooks/useAppSdk";

import "@contentstack/venus-components/build/main.css";
import { transformString } from "../../common/utils/regex-transform";
import { ToggleSwitch } from "@contentstack/venus-components";
import "./SfraCustomUrlField.css";

const DEFAULT_URL = process.env.NEXT_PUBLIC_DEFAULT_URL || "";

const SfraCustomUrlFieldExtension = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();
  const [fullSalesforceUrl, setFullSalesforceUrl] = useState<string>("");
  const [autoUrl, setAutoUrl] = useState<boolean>(true);

  const ref = React.useRef<HTMLDivElement>(null);

  const updateFieldValue = useCallback(
    (url: string, auto: boolean) => {
      if (appSdk?.location?.CustomField) {
        appSdk.location.CustomField.field
          .setData({
            url,
            autoUrl: auto,
          })
          .then(() => {
            //TODO: IMPLEMENT TOAST
          })
          .catch((e) => {
            console.error("Error updating field value:", e);
          });
      }
    },
    [appSdk]
  );

  React.useEffect(() => {
    if (!appSdk?.location?.CustomField || !appConfig?.sfra_app_configuration) return;

    const customField = appSdk.location.CustomField;
    const fieldData = customField.field.getData();

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

    customField.entry.onChange(async (newData) => {
      if (!newData) return;
      // Path is always relative to entry (newData)
      const path = appConfig?.sfra_app_configuration?.inputFieldPath || "product.data[0].slugUrl";
      const productUrl = getValueAtPath(newData, path);
      const autoUrlEnabled = newData?.sfra_url?.autoUrl;
      let newSlug = productUrl;

      if (productUrl) {
        const rules = appConfig?.sfra_app_configuration?.rules || [];

        if (autoUrlEnabled && rules.length) {
          newSlug = transformString(productUrl, rules);
          customField.entry.getField("url").setData(newSlug);
        }
        setFullSalesforceUrl(productUrl);
      } else if (Object.keys(customField.entry._data || {}).length > 0) {
        customField.entry.getField("url").setData(DEFAULT_URL);
      }

      setIsLoading(false);
    });
  }, [appSdk, appConfig]);

  return !appConfig ? (
    <>Loading...</>
  ) : (
    <div className="layout-container" id="sfra-url-root" ref={ref}>
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  <div className="toggle-row">
                    <ToggleSwitch
                      label="Auto URL"
                      checked={autoUrl}
                      onChange={() => {
                        setAutoUrl(() => {
                          updateFieldValue(fullSalesforceUrl, !autoUrl);
                          return !autoUrl;
                        });
                      }}
                    />
                  </div>
                  <div className="url-row">
                    <p className="config-value">{fullSalesforceUrl}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SfraCustomUrlFieldExtension;
