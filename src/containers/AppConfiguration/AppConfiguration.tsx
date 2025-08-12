import React, { useRef } from "react";
import Icon from "../../assets/GearSix.svg";
import localeTexts from "../../common/locales/en-us/index";
import parse from "html-react-parser";
import styles from "./AppConfiguration.module.css";
import { useInstallationData } from "../../common/hooks/useInstallationData";
import Tooltip from "../Tooltip/Tooltip";

const AppConfigurationExtension: React.FC = () => {
  const { installationData, setInstallationData } = useInstallationData();
  console.log("Installation Data: ", installationData);
  const prefixConfigDataRef = useRef<HTMLInputElement>(null);
  const jsonEndpointConfigDataRef = useRef<HTMLInputElement>(null);
  const serverConfigDataRef = useRef<HTMLInputElement>(null);

  const updateConfig = async () => {
    if (typeof setInstallationData !== "undefined") {
      setInstallationData({
        configuration: {
          sfra_app_configuration: {
            prefix: prefixConfigDataRef.current?.value,
            jsonEndpoint: jsonEndpointConfigDataRef.current?.value,
          },
        },
        serverConfiguration: { sfra_server_configuration: serverConfigDataRef.current?.value },
      });
    }
  };

  return (
    <div className={`${styles.layoutContainer}`}>
      <div className={`${styles.appConfig}`}>
        <div className={`${styles.appConfigLogoContainer}`}>
          <img src={Icon} alt="icon" />
          <p>{localeTexts.ConfigScreen.title}</p>
        </div>

        <div className={`${styles.configWrapper}`}>
          <div className={`${styles.configContainer}`}>
            <div className={`${styles.infoContainerWrapper}`}>
              <div className={`${styles.infoContainer}`}>
                <div className={`${styles.labelWrapper}`}>
                  <label htmlFor="appConfigData">Storefront Prefix</label>
                  <Tooltip content="Enter the prefix for your storefront URL, e.g.:'/s/SFRADemo'" />
                </div>
              </div>
              <div className={`${styles.inputContainer}`}>
                <input
                  type="text"
                  ref={prefixConfigDataRef}
                  required
                  value={installationData.configuration.sfra_app_configuration?.prefix || ""}
                  placeholder="Enter Field Value"
                  name="appConfigData"
                  autoComplete="off"
                  className={`${styles.fieldInput}`}
                  onChange={updateConfig}
                />
              </div>
            </div>
            <div className={`${styles.descriptionContainer}`}>
              <p>Use this field to share non-sensitive configurations of your app with other locations.</p>
            </div>
          </div>
          <div className={`${styles.configContainer}`}>
            <div className={`${styles.infoContainerWrapper}`}>
              <div className={`${styles.infoContainer}`}>
                <div className={`${styles.labelWrapper}`}>
                  <label htmlFor="jsonEndpointConfigData">Storefront Prefix</label>
                  <Tooltip content="Enter the full URL for your JSON endpoint for product data, e.g.:'https://zybx-001.dx.commercecloud.salesforce.com/on/demandware.store/Sites-SFRADemo-Site/default/Product-JSON?pid='" />
                </div>
              </div>
              <div className={`${styles.inputContainer}`}>
                <input
                  type="text"
                  ref={jsonEndpointConfigDataRef}
                  required
                  value={installationData.configuration.sfra_app_configuration?.jsonEndpoint || ""}
                  placeholder="Enter Field Value"
                  name="jsonEndpointConfigData"
                  autoComplete="off"
                  className={`${styles.fieldInput}`}
                  onChange={updateConfig}
                />
              </div>
            </div>
            <div className={`${styles.descriptionContainer}`}>
              <p>Use this field to share non-sensitive configurations of your app with other locations.</p>
            </div>
          </div>

          {/* <div className={`${styles.configContainer}`}>
            <div className={`${styles.infoContainerWrapper}`}>
              <div className={`${styles.infoContainer}`}>
                <div className={`${styles.labelWrapper}`}>
                  <label htmlFor="serverConfigData">Sample Server Configuration Field </label>
                  <Tooltip content="You can use this field for information such as Passwords, API Key, Client Secret, Client ID, etc." />
                </div>
              </div>
              <div className={`${styles.inputContainer}`}>
                <input
                  type="text"
                  ref={serverConfigDataRef}
                  required
                  value={installationData.serverConfiguration.sample_app_configuration as string}
                  placeholder="Enter Field Value"
                  name="serverConfigData"
                  autoComplete="off"
                  onChange={updateConfig}
                />
              </div>
            </div>
            <div className={`${styles.descriptionContainer}`}>
              <p>
                Use this field to store sensitive configurations of your app. It is directly shared with the backend via
                webhooks.
              </p>
            </div>
          </div> */}
        </div>

        <div className={`${styles.locationDescription}`}>
          <p className={`${styles.locationDescriptionText}`}>{parse(localeTexts.ConfigScreen.body)}</p>
          <a target="_blank" rel="noreferrer" href={localeTexts.ConfigScreen.button.url}>
            <span className={`${styles.locationDescriptionLink}`}>{localeTexts.ConfigScreen.button.text}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AppConfigurationExtension;
