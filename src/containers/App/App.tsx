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
import { AppConfigurationExtensionProvider } from "../../common/providers/AppConfigurationExtensionProvider";
import { useAppSdk } from "../../common/hooks/useAppSdk";

/**
 * All the routes are Lazy loaded.
 * This will ensure the bundle contains only the core code and respective route bundle
 * improving the page load time
 */
// const CustomFieldExtension = React.lazy(() => import("../CustomField/CustomField"));
const CustomUrlFieldExtension = React.lazy(() => import("../CustomUrlField/CustomUrlField"));
const FieldModifier = React.lazy(() => import("../CustomFieldModifier/FieldModifier"));
const SidebarWidget = React.lazy(() => import("../CustomSidebarWidget/SidebarWidget"));
// const EntrySidebarExtension = React.lazy(() => import("../SidebarWidget/EntrySidebar"));
const AppConfigurationExtension = React.lazy(() => import("../AppConfiguration/AppConfiguration"));
const TestUrlTransform = React.lazy(() => import("../TestUrlTransform"));
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
      <MarketplaceAppProvider excludeUrls={["/test-url-transform"]}>
        <AppConfigurationExtensionProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/url-custom-field" />} />
            <Route
              path="/url-custom-field"
              element={
                <Suspense>
                  <CustomUrlFieldExtension />
                </Suspense>
              }
            />
            <Route
              path="/url-field-modifier"
              element={
                <Suspense>
                  <FieldModifier />
                </Suspense>
              }
            />
            <Route
              path="/url-sidebar-widget"
              element={
                <Suspense>
                  <SidebarWidget />
                </Suspense>
              }
            />
            <Route
              path="/app-configuration"
              element={
                <Suspense>
                  <AppConfigurationExtension />
                </Suspense>
              }
            />
            <Route
              path="/test-url-transform"
              element={
                <Suspense>
                  <TestUrlTransform />
                </Suspense>
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </AppConfigurationExtensionProvider>
      </MarketplaceAppProvider>
    </ErrorBoundary>
  );
}

export default App;
