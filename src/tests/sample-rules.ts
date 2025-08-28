/* eslint-disable no-template-curly-in-string */
export const PLP_EXAMPLE_ONE = {
  plp: [
    {
      inputFieldPath: "product.data[0].slugUrl",
      id: "rule_1",
      description: "Strip host + site → keep path/id",
      pattern: "^(?:https?://)?[^/]+/s/[^/]+/([^?#]+)(?:\\?[^#]*)?$",
      flags: "i",
      replacement: "/$1",
    },
    {
      input: "$rule_1",
      id: "rule_2",
      description: "mens → womans",
      pattern: "(mens)",
      flags: "i",
      replacement: "womans",
    },
    {
      inputFieldPath: "product.data[0].anotherProperty",
      id: "rule_3",
      description: "mens → womans",
      pattern: "[.a-z]+/(santos)/[a-z]{0,3}",
      flags: "i",
      replacement: "best-",
    },
    {
      fromMap: true,
      id: "rule_4",

      replacement: "/this/is/$rule3/summer${$rule_1|lower}",
      description: "mens → womans",
    },
  ],
};
