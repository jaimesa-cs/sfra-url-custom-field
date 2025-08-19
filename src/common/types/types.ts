export interface KeyValueObj {
  [key: string]: string;
}

export interface IAppConfiguration {
  sfra_app_configuration?: {
    rules?: any;
    jsonEndpoint?: string;
  };
}

export type ChildProp = {
  children: string | JSX.Element | JSX.Element[];
};
