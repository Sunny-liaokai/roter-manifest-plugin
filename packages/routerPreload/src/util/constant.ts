type TRoute = string;

interface IModule {
  preload: () => Promise<unknown>;
  loaded: boolean;
}

interface ILoadMap {
  cache: Record<TRoute, boolean>;
  module: Record<string, IModule>;
}

interface IGlobal {
  __ROUTER_MANIFEST__?: Record<string, IFile[]>;
}

export interface IFile {
  type: string;
  href: string;
}

export const loadMap: ILoadMap = {
  cache: {},
  module: {},
};

export const manifestFileName = 'router-manifest.json';

export const global: IGlobal =
  typeof window === 'undefined' ? {} : (window as IGlobal);
