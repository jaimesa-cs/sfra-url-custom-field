export interface KeyValueObj {
  [key: string]: string;
}

export interface IAppConfiguration {
  // Configuration can be a map keyed by content type UID, each with its own rules array
  // or a legacy shape with top-level `rules`.
  app_configuration?: any;
}

export type ChildProp = {
  children: string | JSX.Element | JSX.Element[];
};
