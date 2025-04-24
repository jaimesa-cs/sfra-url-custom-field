import React from "react";
import localeTexts from "../../common/locales/en-us/index";
import parse from "html-react-parser";
import { Link, Navigate, useLocation } from "react-router-dom";

const PageNotFound = () => {
  const location = useLocation();

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="app-component-content">
          <h3>{localeTexts[404].title}</h3>
          <p>{parse(localeTexts[404].body)}</p>
          <a target="_blank" rel="noreferrer" href={localeTexts[404].button.url}>
            {localeTexts[404].button.text}
          </a>
          <div>
            <p>Current URL: {location.pathname}</p>
            <br />
            <p>Full Path with Query: {location.pathname + location.search}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
