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

// import { ModalHeader, ReturnCbModalProps } from "@contentstack/venus-components/build/components/Modal/Modal";
import { pid } from "process";
import { set } from "lodash";
const DEFAULT_URL = "/s/neemo/product-id.html";

const SfraCustomUrlFieldExtension = () => {
  const appConfig = useAppConfig();
  const appSdk = useAppSdk();

  const [, setRelativeUrl] = useState<string>("");
  const [fullSaleseforceUrl, setFullSalesforceUrl] = useState<string>("");
  const [isRawConfigModalOpen, setRawConfigModalOpen] = useState<boolean>(false);
  const [pid, setPid] = useState<string>();

  const handleViewRawConfig = useCallback(() => {
    setRawConfigModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setRawConfigModalOpen(false);
  }, []);

  const sampleAppConfig = appConfig?.["sample_app_configuration"] || "";
  const trimmedSampleAppConfig =
    sampleAppConfig.length > 17 ? `${sampleAppConfig.substring(0, 17)}...` : sampleAppConfig;

  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (appSdk) {
      const iframeWrapperRef = document.getElementById("sfra-url-root");

      window.iframeRef = iframeWrapperRef;
      window.postRobot = appSdk.postRobot;

      const customField = appSdk?.location?.CustomField;
      if (!customField) return;
      // customField?.frame.updateHeight(0);

      customField.entry.onChange(async (newData) => {
        console.log("Entry Changed :: ", newData);
        if (!newData) return;

        const productData = newData.product;

        if (productData && productData.data && productData.data.length > 0) {
          const productD = productData.data[0];

          setPid(productD.id);
          const productUrl = productD?.slugUrl;

          if (productUrl) {
            // e.g. https://www.example.com/products/product-name
            //get the relative url without the domain
            const relativeUrl = productUrl.split("/").slice(3).join("/");
            console.log("Relative URL: ", relativeUrl);
            setRelativeUrl(() => {
              //const newSlug = `/${relativeUrl}`;
              const newSlug = `/${relativeUrl}`;
              setFullSalesforceUrl(() => {
                console.log("Entry :: url:", newSlug);
                customField?.entry?.getField("url").setData(newSlug);
                console.log("Entry ::", customField.entry);
                console.log("New Slug: ", newSlug);
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
  }, [appSdk]);
  const onClose = () => {
    console.log("on modal close");
  };
  return (
    <div className="layout-container" id="sfra-url-root" ref={ref}>
      <div className="ui-location-wrapper">
        <div className="ui-location">
          <div className="input-wrapper">
            <div className="input-container">
              <p className="config-value">{fullSaleseforceUrl}</p>
              <img src={ReadOnly} alt="ReadOnlyLogo" />
            </div>
            {pid && (
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
            )}
            {/* <Icon
              icon="Expand"
              hover={true}
              hoverType="secondary"
              shadow="medium"
              onClick={() => {
                cbModal({
                  component: (props: ModalProps) => <ModalComponent closeModal={onClose} />,
                  modalProps: {
                    onClose,
                    onOpen: () => {
                      console.log("onOpen gets called");
                    },
                  },
                  testId: "cs-modal-storybook",
                });
              }}
            /> */}

            {isRawConfigModalOpen && appConfig && <ConfigModal config={appConfig} onClose={handleCloseModal} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SfraCustomUrlFieldExtension;
