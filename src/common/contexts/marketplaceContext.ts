import React from "react";
import { IAppConfiguration, KeyValueObj } from "../types/types";
import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";

export type MarketplaceAppContextType = {
  appSdk: UiLocation | null;
  appConfig: IAppConfiguration | null;
};

export const MarketplaceAppContext = React.createContext<MarketplaceAppContextType>({
  appSdk: null,
  appConfig: null,
});
