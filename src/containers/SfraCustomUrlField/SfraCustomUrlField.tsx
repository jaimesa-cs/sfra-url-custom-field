import React, { useCallback, useState } from "react";
import { useAppConfig } from "../../common/hooks/useAppConfig";
import "../index.css";
import "./SfraCustomUrlField.css";
import ReadOnly from "../../assets/lock.svg";
import { useAppSdk } from "../../common/hooks/useAppSdk";

import ConfigModal from "../../components/ConfigModal/ConfigModal";
import { cbModal, Icon } from "@contentstack/venus-components";
import { ModalProps } from "@contentstack/venus-components/build/components/Modal/Modal";
import ModalComponent from "./ModalDialog";
import { transformString } from "../../common/utils/regex-transform";

// import { ModalHeader, ReturnCbModalProps } from "@contentstack/venus-components/build/components/Modal/Modal";

const DEFAULT_URL = process.env.NEXT_PUBLIC_DEFAULT_URL || "";

const SfraCustomUrlFieldExtension = () => {
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();

  const [, setRelativeUrl] = useState<string>("");
  const [fullSalesforceUrl, setFullSalesforceUrl] = useState<string>("");
  const [isRawConfigModalOpen, setRawConfigModalOpen] = useState<boolean>(false);
  const [pid, setPid] = useState<string>();

  const handleCloseModal = useCallback(() => {
    setRawConfigModalOpen(false);
  }, []);

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    console.log("SfraCustomUrlFieldExtension mounted", appConfig);
    if (appSdk && appConfig && appConfig.sfra_app_configuration) {
      const iframeWrapperRef = document.getElementById("sfra-url-root");
      window.iframeRef = iframeWrapperRef;
      window.postRobot = appSdk.postRobot;

      const customField = appSdk?.location?.CustomField;
      if (!customField) return;
      // customField?.frame.updateHeight(0);

      customField.entry.onChange(async (newData) => {
        if (!newData) return;

        const productData = newData.product;

        if (productData && productData.data && productData.data.length > 0) {
          const productD = productData.data[0];

          setPid(productD.id);
          const productUrl = productD?.slugUrl;

          if (productUrl) {
            let newSlug = productUrl;
            // console.log("Product URL before transformation:", newSlug);
            if (appConfig?.sfra_app_configuration?.rules) {
              newSlug = transformString(productUrl, JSON.parse(appConfig?.sfra_app_configuration?.rules) || []);
              // console.log("Product URL after transformation:", newSlug);
            }

            setRelativeUrl(() => {
              //const newSlug = `/${relativeUrl}`;
              setFullSalesforceUrl(() => {
                customField?.entry?.getField("url").setData(newSlug);
                customField.field.setData(newSlug);
                return productUrl;
              });
              return newSlug;
            });
          }
        } else {
          if (Object.keys(customField.entry._data).length > 0) {
            customField.entry?.getField("url").setData(DEFAULT_URL);
          }
        }
      });
    }
  }, [appSdk, appConfig]);
  const onClose = () => {
    console.log("on modal close");
  };
  return !appConfig ? (
    <>Loading...</>
  ) : (
    <div className="layout-container" id="sfra-url-root" ref={ref}>
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              <p className="config-value">{fullSalesforceUrl}</p>
              <img src={ReadOnly} alt="ReadOnlyLogo" />
            </div>
            {/* {pid && (
              <Icon
                icon="CodeMedium"
                size="medium"
                hover={true}
                hoverType="secondary"
                shadow="medium"
                onClick={() => {
                  cbModal({
                    component: (props: ModalProps) => (
                      <ModalComponent
                        pid={pid}
                        jsonEndpoint={appConfig.sfra_app_configuration?.jsonEndpoint || ""}
                        closeModal={() => {
                          setRawConfigModalOpen(false);
                        }}
                        {...props}
                      />
                    ),
                    modalProps: {
                      onClose,
                      onOpen: () => {
                        console.log("onOpen gets called");
                      },
                    },
                    testId: "cs-modal-storybook",
                  });
                }}
              />
            )} */}

            {isRawConfigModalOpen && appConfig && <ConfigModal config={appConfig} onClose={handleCloseModal} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SfraCustomUrlFieldExtension;
