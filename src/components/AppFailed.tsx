import React from "react";
import localeTexts from "../common/locales/en-us";

/**
 * AppFailed component.
 * This components will be rendered if the App fails to initialize.( ContentStack SDK)
 */
export const AppFailed = () => {
  const handleLearnMoreClick = () => {
    window.open(localeTexts.AppFailed.button.url, "_blank");
  };
  return (
    <div className="app-failed-container">
      <div className="app-component-container" role="alert">
        <div className="app-content">
          <h3>
            {localeTexts.AppFailed.Message1} <br />
            {localeTexts.AppFailed.Message2}
          </h3>
        </div>
        <div className="app-text">{localeTexts.AppFailed.body}</div>
        <div className="secondary-app-container">
          <button type="button" onClick={handleLearnMoreClick}>
            {localeTexts.AppFailed.button.text}
          </button>
        </div>
      </div>
    </div>
  );
};
