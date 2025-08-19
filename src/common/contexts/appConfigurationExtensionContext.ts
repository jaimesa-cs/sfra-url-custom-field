import React from "react";

export type InstallationData = {
  configuration: { sfra_app_configuration?: { rules?: any } };
  serverConfiguration: { [key: string]: unknown };
};

export type AppConfigurationExtensionContextType = {
  installationData: InstallationData;
  setInstallationData: (installationData: InstallationData) => void;
  loading: boolean;
};

export const AppConfigurationExtensionContext = React.createContext<AppConfigurationExtensionContextType>({
  installationData: {
    configuration: {},
    serverConfiguration: {},
  },
  setInstallationData: () => ({}),
  loading: false,
});
