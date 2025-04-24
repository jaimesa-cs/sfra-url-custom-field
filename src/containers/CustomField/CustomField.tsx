import "@contentstack/venus-components/build/main.css";

import { useCallback, useEffect, useState } from "react";

import ContentstackAppSdk from "@contentstack/app-sdk";
import ReactJson from "react-json-view";

const CustomFieldExtension = () => {
  const [error, setError] = useState<any>(null);
  const [app, setApp] = useState({} as any);
  const [url, setUrl] = useState("");
  const [sfUrl, setSfUrl] = useState("");
  const [payload, setPayload] = useState({} as any);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (sfUrl) {
          //zybx-002.dx.commercecloud.salesforce.com/s/neemo/spring-lookM.html
          //the productId is the last part of the url without the .html

          const productId = sfUrl.split("/").pop()?.split(".")[0];

          const response = await fetch(
            //`https://zybx-002.dx.commercecloud.salesforce.com/on/demandware.store/Sites-neemo-Site/default/Product-JSON?pid=${productId}`,
            `https://zybx-002.dx.commercecloud.salesforce.com/on/demandware.store/Sites-neemo-Site/default/CorsTest-Show`,
            {
              method: "GET",
              mode: "cors",
              credentials: "include", // optional, if you need cookies or session info
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          console.log("response", response);
          const data = await response.json();
          console.log("data", data);
          setPayload(data);
        }
      } catch (error) {
        console.error("Error fetching data:");
        console.error(error);
      }
    };

    fetchData();
  }, [sfUrl]);

  const initializeApp = useCallback(async () => {
    if (app) {
      const customField = await app?.location?.CustomField;
      const entry = customField?.entry;

      setUrl(entry?.getData()?.url);
      // customField?.frame?.updateHeight(0);

      entry?.onChange((data: any) => {
        const result = constructUrl(data);
        const url = result.url;
        setUrl(url);
        setSfUrl(result.slugUrl);
        customField.entry.getField("url").setData(url);
        customField.field.setData(url);
      });
    }
  }, [app, app?.location?.CustomField.entry]);

  const constructUrl = (data: any) => {
    // get product.data from data, and get the first element of the array

    const product = data?.product?.data[0] || {};

    // check for slugUrl property in product
    const slugUrl = product?.slugUrl || "";

    if (!slugUrl) {
      return { url: "/slug-url-not-found", slugUrl };
    }

    // from a url like this: https://zybx-002.dx.commercecloud.salesforce.com/s/neemo/25720037M.html
    // get the partial url without the domain, starting with /
    const url = slugUrl.split("/").slice(3).join("/");

    return { url: `/${url}`, slugUrl };
  };

  useEffect(() => {
    // eslint-disable-next-line no-restricted-globals
    if (typeof window !== "undefined" && self === top) {
      setError("Error");
    } else {
      ContentstackAppSdk.init().then((appSdk) => {
        setApp(appSdk);
        initializeApp();
      });
    }
  }, [initializeApp]);

  return error ? (
    <h3>{error}</h3>
  ) : sfUrl ? (
    <div>
      <a href={sfUrl} target="_blank">
        {sfUrl}
      </a>
      <br />
      <br />

      {payload && <ReactJson src={payload} />}
    </div>
  ) : (
    <p>Please select a product</p>
  );
};

export default CustomFieldExtension;
