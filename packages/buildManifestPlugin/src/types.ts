export interface Asset {
  type: string;
  href: string;
}

export interface CompilationAsset {
  source(): string;
  size(): number;
}

export interface Compilation {
  assets: Record<string, CompilationAsset>;
  errors: Error[];
  getStats(): {
    toJson(): {
      chunks: any[];
      modules: any[];
    };
  };
}
