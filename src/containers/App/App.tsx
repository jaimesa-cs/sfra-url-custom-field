import React, { Suspense } from "react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";
import { Route, Routes } from "react-router-dom";
import { EntrySidebarExtensionProvider } from "../../common/providers/EntrySidebarExtensionProvider";
import { AppConfigurationExtensionProvider } from "../../common/providers/AppConfigurationExtensionProvider";
import { CustomFieldExtensionProvider } from "../../common/providers/CustomFieldExtensionProvider";

/**
 * All the routes are Lazy loaded.
 * This will ensure the bundle contains only the core code and respective route bundle
 * improving the page load time
 */
const CustomFieldExtension = React.lazy(() => import("../CustomField/CustomField"));
const EntrySidebarExtension = React.lazy(() => import("../SidebarWidget/EntrySidebar"));
const AppConfigurationExtension = React.lazy(() => import("../ConfigScreen/AppConfiguration"));
const AssetSidebarExtension = React.lazy(() => import("../AssetSidebarWidget/AssetSidebar"));
const StackDashboardExtension = React.lazy(() => import("../DashboardWidget/StackDashboard"));
const PageNotFound = React.lazy(() => import("../404/404"));
const DefaultPage = React.lazy(() => import("../index"));

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/test"
          element={
            <button
              onClick={() => {
                fetch(`https://zybx-002.dx.commercecloud.salesforce.com/s/neemo/spring-lookM.html?json=true`, {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }).then((response) => {
                  console.log("response", response);
                  const data = response.json();
                  console.log("data", data);
                });
              }}>
              Click Me
            </button>
          }
        />
        <Route path="/" element={<DefaultPage />} />
        <Route
          path="/sfra-url-custom-field"
          element={
            <MarketplaceAppProvider>
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldExtension />
                </CustomFieldExtensionProvider>
              </Suspense>
            </MarketplaceAppProvider>
          }
        />
        <Route
          path="/sfra-url-custom-field"
          element={
            <Suspense>
              <CustomFieldExtensionProvider>
                <CustomFieldExtension />
              </CustomFieldExtensionProvider>
            </Suspense>
          }
        />
        <Route
          path="/entry-sidebar"
          element={
            <Suspense>
              <EntrySidebarExtensionProvider>
                <EntrySidebarExtension />
              </EntrySidebarExtensionProvider>
            </Suspense>
          }
        />
        <Route
          path="/app-configuration"
          element={
            <Suspense>
              <AppConfigurationExtensionProvider>
                <AppConfigurationExtension />
              </AppConfigurationExtensionProvider>
            </Suspense>
          }
        />
        <Route
          path="/asset-sidebar"
          element={
            <Suspense>
              <AssetSidebarExtension />
            </Suspense>
          }
        />
        <Route
          path="/stack-dashboard"
          element={
            <Suspense>
              <StackDashboardExtension />
            </Suspense>
          }
        />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
