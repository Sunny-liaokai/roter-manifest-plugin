import { global, IFile, loadMap } from './constant';

const getFilesFromGlobal = (flag: string) => {
  const files = global.__ROUTER_MANIFEST__ && global.__ROUTER_MANIFEST__[flag];

  if (files && files.length && files instanceof Array) {
    return files;
  }

  return [];
};

export const initAllPreloadFiles = async (options: {
  publicPath: string;
  filename: string;
}) => {
  if (global.__ROUTER_MANIFEST__) {
    return global.__ROUTER_MANIFEST__;
  }

  const { publicPath, filename } = options;

  const url = publicPath.endsWith('/')
    ? publicPath + filename
    : `${publicPath}/${filename}`;

  return fetch(url)
    .then((res) => res.json())
    .then((res) => {
      global.__ROUTER_MANIFEST__ = res;

      return res;
    });
};

export const getPreloadFilesFromFlag = async (
  flag: string,
  options: { publicPath: string; filename: string },
) => {
  if (!flag) return [];

  if (global.__ROUTER_MANIFEST__) {
    return getFilesFromGlobal(flag);
  }

  return initAllPreloadFiles(options).then(() => {
    return getFilesFromGlobal(flag);
  });
};

export const checkComponentLoaded = (href: string, type: 'script' | 'mf') => {
  const componentKeys = Object.keys(loadMap.module);

  if (type === 'script') {
    for (let index = 0; index < componentKeys.length; index++) {
      const key = componentKeys[index];

      if (href.match(key) || key.match(href)) {
        if (loadMap.module[key].loaded) return true;
        loadMap.module[key].preload();
        break;
      }
    }
  } else if (type === 'mf') {
    for (let index = 0; index < componentKeys.length; index++) {
      const key = componentKeys[index];

      if (key.match(href)) {
        if (loadMap.module[key].loaded) return true;
        loadMap.module[key].preload();
        break;
      }
    }
  }
};

export const fetchFiles = (files: IFile[]) => {
  if (!files.length) return;

  const appendLink = (href: string, type: string) => {
    if (loadMap.cache[href]) return;
    loadMap.cache[href] = true;
    const mfInfo = href.split('/');
    let dom;

    switch (type) {
      case 'script':
        if (!checkComponentLoaded(href.toLocaleLowerCase(), 'script')) {
          dom = document.createElement('script');

          dom.src =
            href.startsWith('/') || href.startsWith('http') ? href : `/${href}`;
        }

        break;
      case 'mf':
        if (
          !checkComponentLoaded(
            `${mfInfo[0].toLocaleLowerCase()}_${mfInfo[1].toLocaleLowerCase()}`,
            'mf',
          )
        ) {
          // @ts-ignore
          mfInfo[0] && global[mfInfo[0]].get('./' + mfInfo[1]);
        }

        break;
      default:
        dom = document.createElement('link');
        dom.as = type;
        dom.rel = 'prefetch';
        dom.href = `${href}`;
        dom.crossOrigin = 'crossorigin';
        break;
    }

    if (dom) {
      document.head.appendChild(dom);
    }
  };

  files.forEach((file) => {
    appendLink(file.href, file.type);
  });
};
