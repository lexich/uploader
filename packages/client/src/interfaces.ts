export interface IFile {
    id: number;
    name: string;
    url: string;
  }
  export interface IAssetManifest {
    files: Record<string, string>;
    entrypoints: string[];
  }
