import React, { useCallback, useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import "../index.css";
import "./SfraCustomUrlField.css";
import ReadOnly from "../../assets/lock.svg";
import { useAppSdk } from "../../common/hooks/useAppSdk";
import { set } from "lodash";

const SfraCustomUrlFieldExtension = () => {
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();
  const [relativeUrl, setRelativeUrl] = useState<string>("");
  const [fullSaleseforceUrl, setFullSalesforceUrl] = useState<string>("");
  const [isRawConfigModalOpen, setRawConfigModalOpen] = useState<boolean>(false);

  const handleViewRawConfig = useCallback(() => {
    setRawConfigModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setRawConfigModalOpen(false);
  }, []);

  const sampleAppConfig = appConfig?.["sample_app_configuration"] || "";
  const trimmedSampleAppConfig =
    sampleAppConfig.length > 17 ? `${sampleAppConfig.substring(0, 17)}...` : sampleAppConfig;

  React.useEffect(() => {
    if (appSdk) {
      const customField = appSdk?.location?.CustomField;
      if (!customField) return;
      customField?.frame.updateHeight(0);
      const url = customField?.entry.getData().url;
      const d = customField?.entry.getData();

      appSdk?.location?.CustomField?.entry.onChange(async () => {
        const productData = customField?.entry.getData().product;
        if (productData && productData.data && productData.data.length > 0) {
          const productD = productData.data[0];
          const productUrl = productD?.slugUrl;
          if (productUrl) {
            // e.g. https://www.example.com/products/product-name
            //get the relative url without the domain
            const relativeUrl = productUrl.split("/").slice(3).join("/");
            setRelativeUrl(() => {
              const newSlug = `/${relativeUrl}`;
              setFullSalesforceUrl(() => {
                customField?.entry.getField("url")?.setData(newSlug);
                customField?.field.setData(newSlug);
                return productUrl;
              });
              return newSlug;
            });
          }
        }
      });
    }
  }, [appSdk]);
  return (
    <div className="layout-container">
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              <p className="config-value">{fullSaleseforceUrl}</p>
              <img src={ReadOnly} alt="ReadOnlyLogo" />
            </div>
            {/* <img src={JsonView} alt="Show-Json-CTA" className="show-json-cta" onClick={handleViewRawConfig} />
            {isRawConfigModalOpen && appConfig && <ConfigModal config={appConfig} onClose={handleCloseModal} />} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SfraCustomUrlFieldExtension;
