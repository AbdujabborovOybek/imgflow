import multer from "multer";
import type { RequestHandler } from "express";
import { imgflow } from "./middleware";
import type { ImgflowOptions, FieldConfig } from "./types";

function toMulterFields(fields: Record<string, FieldConfig>) {
  return Object.entries(fields).map(([name, cfg]) => {
    const maxCount = typeof cfg === "string" ? 1 : cfg.maxCount ?? 1;
    return { name, maxCount };
  });
}

export function imgflowUpload(opts: ImgflowOptions): RequestHandler[] {
  const upload = multer({ storage: multer.memoryStorage() });

  // multer middleware (req.files ni tayyorlab beradi)
  const multerMw = upload.fields(toMulterFields(opts.fields));

  // imgflow middleware (req.files ni o'qib, diskka saqlaydi)
  const imgflowMw = imgflow(opts);

  return [multerMw, imgflowMw];
}
