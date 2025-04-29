// Extend the Window interface to include iframeRef
declare global {
  interface Window {
    iframeRef: HTMLElement | null;
  }
}

import React, { Suspense } from "react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";
import { Navigate, Route, Routes } from "react-router-dom";
import { EntrySidebarExtensionProvider } from "../../common/providers/EntrySidebarExtensionProvider";
import { AppConfigurationExtensionProvider } from "../../common/providers/AppConfigurationExtensionProvider";
import { CustomFieldExtensionProvider } from "../../common/providers/CustomFieldExtensionProvider";
import FieldModifierExtension from "../FieldModifier/FieldModifier";
import { useAppSdk } from "../../common/hooks/useAppSdk";

/**
 * All the routes are Lazy loaded.
 * This will ensure the bundle contains only the core code and respective route bundle
 * improving the page load time
 */
// const CustomFieldExtension = React.lazy(() => import("../CustomField/CustomField"));
const SfraCustomUrlFieldExtension = React.lazy(() => import("../SfraCustomUrlField/SfraCustomUrlField"));
// const EntrySidebarExtension = React.lazy(() => import("../SidebarWidget/EntrySidebar"));
// const AppConfigurationExtension = React.lazy(() => import("../AppConfiguration/AppConfiguration"));
// const AssetSidebarExtension = React.lazy(() => import("../AssetSidebarWidget/AssetSidebar"));
// const StackDashboardExtension = React.lazy(() => import("../DashboardWidget/StackDashboard"));
// const FullPageExtension = React.lazy(() => import("../FullPage/FullPage"));
const PageNotFound = React.lazy(() => import("../404/404"));
// const DefaultPage = React.lazy(() => import("../index"));
// const ContentTypeSidebarExtension = React.lazy(() => import("../ContentTypeSidebar/ContentTypeSidebar"));

function App() {
  const appSdk = useAppSdk();

  return (
    <ErrorBoundary>
      <MarketplaceAppProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/sfra-url-custom-field" />} />
          <Route
            path="/sfra-url-custom-field"
            element={
              <Suspense>
                <SfraCustomUrlFieldExtension />
              </Suspense>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </MarketplaceAppProvider>
    </ErrorBoundary>
  );
}

export default App;
