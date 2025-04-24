import React from "react";

import { KeyValueObj } from "../types/types";

export type MarketplaceAppContextType = {
  appSdk: any | null;
  appConfig: KeyValueObj | null;
};

export const MarketplaceAppContext = React.createContext<MarketplaceAppContextType>({
  appSdk: null,
  appConfig: null,
});
