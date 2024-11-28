import type { Compilation, Compiler, StatsAsset, StatsChunk } from 'webpack';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

interface Asset {
  type: string;
  href: string;
}

interface PluginOptions {
  routerPath: string;
  mfPreloadMap?: Record<string, string>;
  filename?: string;
}

interface ManifestData {
  [key: string]: Asset[];
}

// 修改 Source 接口定义
interface Source {
  source(): string;
  size(): number;
  map(): null;
  sourceAndMap(): { source: string; map: null };
  updateHash(hash: any): void;
  buffer(): Buffer;
}

// 更新 WebpackCompilation 接口
interface WebpackCompilation {
  getStats(): {
    toJson(): {
      chunks: StatsChunk[];
      assets: StatsAsset[];
    };
  };
  emitAsset(file: string, source: Source): void;
  assets: Record<string, Source>;
  errors: any[];
  hooks: Compilation['hooks'];
}

// 工具函数
function toAsset(str: string): string | false {
  if (/\.js$/i.test(str)) return 'script';
  if (/\.(svg|jpe?g|png|webp)$/i.test(str)) return 'image';
  if (/\.(woff2?|otf|ttf|eot)$/i.test(str)) return 'font';
  if (/\.css$/i.test(str)) return 'style';

  return false;
}

// 插件主体
class RouteResourcePreloadPlugin {
  private readonly options: Required<PluginOptions>;
  private readonly PLUGIN_NAME = 'RouteResourcePreloadPlugin';
  private routeMap: Record<string, string[]> = {};

  constructor(options: PluginOptions) {
    if (!options.routerPath) {
      throw new Error('routerPath is required');
    }

    this.options = {
      routerPath: options.routerPath,
      mfPreloadMap: options.mfPreloadMap || {},
      filename: options.filename || 'manifest.json',
    };

    // 初始化时解析路由配置
    this.parseRouterConfig();
  }

  private parseRouterConfig(): void {
    try {
      const routerPath = resolve(this.options.routerPath);
      const content = readFileSync(routerPath, 'utf-8');

      // 使用正则匹配路由配置
      const routeRegex =
        /path:\s*['"]([^'"]+)['"],\s*lazy:\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;

      let match;

      while ((match = routeRegex.exec(content)) !== null) {
        const [, path, importPath] = match;
        this.routeMap[path] = [importPath];
      }

      console.log('Parsed route map:', this.routeMap);
    } catch (error) {
      throw new Error(
        `Failed to parse router file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private createManifest(compilation: WebpackCompilation): ManifestData {
    const manifest: ManifestData = {};
    const { chunks = [] } = compilation.getStats().toJson();

    // 首先处理入口文件的资源
    const entryChunk = chunks.find((chunk) => chunk.entry);

    if (entryChunk?.files) {
      manifest['*'] = this.createAssetList(entryChunk.files);
    }

    // 按照路由文件中的顺序处理路由
    Object.keys(this.routeMap).forEach((route) => {
      const matchingChunk = chunks.find((chunk) => {
        if (!chunk.origins?.[0]?.request || chunk.entry) return false;

        const componentPath = chunk.origins[0].request
          .replace(/^\.\.\/pages\//, '')
          .replace(/\.[^/.]+$/, '');

        return this.routeMap[route].some((pattern) =>
          pattern.includes(componentPath),
        );
      });

      if (matchingChunk?.files) {
        manifest[route] = this.createAssetList(matchingChunk.files);
      }
    });

    // 最后处理模块联邦
    if (this.options.mfPreloadMap) {
      Object.entries(this.options.mfPreloadMap).forEach(([path, mfPath]) => {
        if (!manifest[path]) manifest[path] = [];

        manifest[path].push({
          type: 'mf',
          href: mfPath,
        });
      });
    }

    return manifest;
  }

  private createAssetList(files: string[]): Asset[] {
    return files
      .map((file) => {
        const type = toAsset(file);
        if (!type) return null;

        // 确保路径以 / 开头，并且没有重复的 /
        const href = file.startsWith('/') ? file : `/${file}`;

        return { type, href };
      })
      .filter((asset): asset is Asset => asset !== null);
  }

  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap(
      this.PLUGIN_NAME,
      (compilation: Compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: this.PLUGIN_NAME,
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          () =>
            this.generateManifest(compilation as unknown as WebpackCompilation),
        );
      },
    );
  }

  private generateManifest(compilation: WebpackCompilation): void {
    try {
      const manifest = this.createManifest(compilation);
      this.emitManifest(compilation, manifest);
    } catch (error) {
      this.handleError(compilation, error);
    }
  }

  private emitManifest(
    compilation: WebpackCompilation,
    manifest: ManifestData,
  ): void {
    const manifestContent = JSON.stringify(manifest, null, 2);
    const inlineScript = `window.__ROUTER_MANIFEST__=${manifestContent};`;

    // 创建 source 对象
    const createSource = (content: string): Source => ({
      source: () => content,
      size: () => content.length,
      map: () => null,
      sourceAndMap: () => ({ source: content, map: null }),
      updateHash: () => {},
      buffer: () => Buffer.from(content),
    });

    // 输出 manifest.json
    compilation.emitAsset(this.options.filename, createSource(manifestContent));

    // 注入到入口文件
    const stats = compilation.getStats().toJson();

    const entryFile = stats.assets?.find(
      (asset) =>
        asset.name.endsWith('.js') &&
        asset.chunks?.some(
          (chunk) => stats.chunks?.find((c) => c.id === chunk)?.initial,
        ),
    );

    if (entryFile?.name && compilation.assets[entryFile.name]) {
      const originalSource = compilation.assets[entryFile.name].source();

      compilation.assets[entryFile.name] = createSource(
        `${inlineScript}\n${originalSource}`,
      );
    }
  }

  private handleError(compilation: WebpackCompilation, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    const webpackError = {
      name: this.PLUGIN_NAME,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    };

    compilation.errors.push(webpackError);
  }
}

export default RouteResourcePreloadPlugin;
