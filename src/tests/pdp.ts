export const DEFAULT_URL =
  "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US";

export const DEFAULT_RULES = {
  plp: [
    {
      inputFieldPath: "product.data[0].slugUrl",
      id: "rule_1",
      description: "Strip host + site → keep path/id",
      pattern: "^(?:https?://)?[^/]+/s/[^/]+/([^?#]+)$",
      flags: "i",
      replacement: "/$1",
    },
    // {
    //   id: "rule_3",
    //   fromMap: true,
    //   input: "/$rule_1",
    //   description: "Prefix locale",
    //   pattern: "^(.*)$",
    //   replacement: "/en-us/${$1|lower}",
    //   stopOnMatch: false,
    // },
  ],
};
export const DEFAULT_ENTRY = {
  product: {
    data: [
      {
        slugUrl:
          "https://zybx-009.dx.commercecloud.salesforce.com/s/RefArch/mens-cotton-stretch-pant/44736828M.html?lang=en_US",
      },
    ],
  },
};
