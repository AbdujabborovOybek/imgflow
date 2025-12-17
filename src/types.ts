export type Fit = "inside" | "cover" | "contain" | "fill" | "outside";

export type ResizeOptions = {
  width?: number;
  height?: number;
  fit?: Fit;
  withoutEnlargement?: boolean;
};

export type OutputOptions = {
  format?: "jpeg" | "png" | "webp" | "avif"; // default: original
  quality?: number; // default: sharp default (jpeg/webp/avif)
  compressionLevel?: number; // png uchun (0..9)
};

export type FieldConfig =
  | string
  | {
      dir: string;
      maxCount?: number; // default 1
      resize?: ResizeOptions;
      output?: OutputOptions;
    };

export type ImgflowOptions = {
  uploadRoot: string; // masalan "uploads"
  fields: Record<string, FieldConfig>; // cover/images/avatar...
  fileName?: (ctx: { field: string; ext: string }) => string;
  onError?: (err: Error) => { status?: number; message: string };
};
