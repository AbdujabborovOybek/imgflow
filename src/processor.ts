import sharp from "sharp";
import type { OutputOptions, ResizeOptions } from "./types";

function normFormat(fmt: string) {
  const f = fmt.toLowerCase();
  return f === "jpg" ? "jpeg" : f;
}

export async function buildPipeline(
  buffer: Buffer,
  resize?: ResizeOptions,
  output?: OutputOptions
) {
  const meta = await sharp(buffer).metadata();
  if (!meta?.format) throw new Error("INVALID_IMAGE");

  const originalFormat = normFormat(meta.format);
  const finalFormat = normFormat(output?.format || originalFormat); // default: original

  let pipeline = sharp(buffer, { failOn: "error" });

  // resize: faqat width yoki height bo'lsa ham ratio saqlanadi
  if (resize?.width || resize?.height) {
    const fit =
      resize.fit || (resize.width && resize.height ? "cover" : "inside");
    const withoutEnlargement =
      typeof resize.withoutEnlargement === "boolean"
        ? resize.withoutEnlargement
        : true;

    pipeline = pipeline.resize({
      width: resize.width,
      height: resize.height,
      fit,
      position: "centre",
      withoutEnlargement,
    });
  }

  // output options: quality berilmasa sharp default ishlaydi
  if (finalFormat === "jpeg") {
    const opt: sharp.JpegOptions = { mozjpeg: true };
    if (typeof output?.quality === "number") opt.quality = output.quality;
    pipeline = pipeline.jpeg(opt);
  } else if (finalFormat === "png") {
    const opt: sharp.PngOptions = {};
    if (typeof output?.compressionLevel === "number")
      opt.compressionLevel = output.compressionLevel;
    pipeline = pipeline.png(opt);
  } else if (finalFormat === "webp") {
    const opt: sharp.WebpOptions = {};
    if (typeof output?.quality === "number") opt.quality = output.quality;
    pipeline = pipeline.webp(opt);
  } else if (finalFormat === "avif") {
    const opt: sharp.AvifOptions = {};
    if (typeof output?.quality === "number") opt.quality = output.quality;
    pipeline = pipeline.avif(opt);
  }

  return { pipeline, finalFormat };
}
