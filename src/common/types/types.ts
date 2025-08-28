export interface KeyValueObj {
  [key: string]: string;
}

export interface IAppConfiguration {
  sfra_app_configuration?: {
    jsonEndpoint?: string;
    inputFieldPath?: string;
    rules: any;
  };
}

export type ChildProp = {
  children: string | JSX.Element | JSX.Element[];
};
