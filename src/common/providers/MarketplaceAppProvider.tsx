import React, { useEffect, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";
import { isNull } from "lodash";

import { IAppConfiguration } from "../types/types";
import { AppFailed } from "../../components/AppFailed";
import { MarketplaceAppContext } from "../contexts/marketplaceContext";
import { ContentType } from "@contentstack/app-sdk/dist/src/types/stack.types";

type ProviderProps = {
  children?: React.ReactNode;
  excludeUrls?: string[];
};

/**
 * Marketplace App Provider
 * @param children: React.ReactNode
 */

export const MarketplaceAppProvider: React.FC<ProviderProps> = ({ children, excludeUrls = [] }) => {
  const [failed, setFailed] = useState<boolean>(false);
  const [appSdk, setAppSdk] = useState<UiLocation | null>(null);
  const [appConfig, setConfig] = useState<IAppConfiguration | null>(null);
  const [excluded, setExcluded] = useState<boolean>(false);

  const [sdkState, setSdkState] = useState<{
    contentType: ContentType | null;
    globalFields: unknown[];
    error: Error | null;
  }>({
    contentType: null,
    globalFields: [],
    error: null,
  });
  // Initialize the SDK and track analytics event
  useEffect(() => {
    const currentHashedPath = document.location.hash.replace("#", "");
    console.log("Current hashed path:", document.location);
    if (excludeUrls.includes(currentHashedPath)) {
      setExcluded(true);
      return;
    }
    ContentstackAppSDK.init()
      .then(async (appSdk) => {
        setAppSdk(appSdk);
        //updated Height of the Custom Field Iframe.
        appSdk.location.DashboardWidget?.frame?.disableAutoResizing();
        await appSdk.location.CustomField?.frame?.updateHeight?.(80);
        //updated Height and Width of the Field Modifier Iframe.
        appSdk.location.FieldModifierLocation?.frame?.disableAutoResizing();
        await appSdk.location.FieldModifierLocation?.frame?.updateDimension({ height: 380, width: 520 });
        // //updated Height of the Stack Dashboard Iframe.
        appSdk.location.DashboardWidget?.frame?.disableAutoResizing();
        await appSdk.location.DashboardWidget?.frame?.updateHeight?.(722);

        const appConfig = await appSdk.getConfig();

        setConfig(appConfig);
      })
      .catch(() => {
        setFailed(true);
      });
  }, []);

  if (excluded) {
    return <>{children}</>;
  }

  // wait until the SDK is initialized. This will ensure the values are set
  // correctly for appSdk.
  if (!failed && isNull(appSdk)) {
    return <div>Loading...</div>;
  }

  if (failed) {
    return <AppFailed />;
  }

  return <MarketplaceAppContext.Provider value={{ appSdk, appConfig }}>{children}</MarketplaceAppContext.Provider>;
};
