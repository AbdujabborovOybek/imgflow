import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { ImgflowOptions, FieldConfig } from "./types";
import { safeResolve, ensureDir } from "./storage";
import { buildPipeline } from "./processor";

type MulterFile = {
  fieldname: string;
  mimetype: string;
  buffer: Buffer;
};

function normalize(field: string, cfg: FieldConfig) {
  if (typeof cfg === "string") return { dir: cfg, maxCount: 1 as number };
  return {
    dir: cfg.dir,
    maxCount: cfg.maxCount ?? 1,
    resize: cfg.resize,
    output: cfg.output,
  };
}

function getFiles(req: any, field: string): MulterFile[] {
  const f = req.files;
  if (!f) return [];
  if (Array.isArray(f))
    return f.filter((x: MulterFile) => x.fieldname === field);
  return (f as Record<string, MulterFile[]>)[field] || [];
}

/**
 * imgflow(opts) -> express middleware
 * Siz faqat uploadRoot va fields mapping berasiz.
 */
export function imgflow(opts: ImgflowOptions) {
  return async (req: any, res: any, next: any) => {
    try {
      for (const field of Object.keys(opts.fields)) {
        const cfg = normalize(field, opts.fields[field]);
        const files = getFiles(req, field);
        if (!files.length) continue;

        if (files.length > cfg.maxCount) {
          throw new Error(`LIMIT_${field}`);
        }

        const { target } = safeResolve(opts.uploadRoot, cfg.dir);
        ensureDir(target);

        const saved: string[] = [];

        try {
          for (const file of files) {
            if (!file?.mimetype?.startsWith("image/")) {
              throw new Error("INVALID_TYPE");
            }

            const { pipeline, finalFormat } = await buildPipeline(
              file.buffer,
              (cfg as any).resize,
              (cfg as any).output
            );

            const name =
              opts.fileName?.({ field, ext: finalFormat }) ||
              `${uuidv4()}.${finalFormat}`;

            await pipeline.toFile(path.join(target, name));
            saved.push(name);
          }

          req.body[field] = cfg.maxCount === 1 ? saved[0] : saved;
        } catch (e) {
          // cleanup
          for (const fn of saved) {
            try {
              const p = path.join(target, fn);
              if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch {}
          }
          throw e;
        }
      }

      return next();
    } catch (err: any) {
      const mapped = opts.onError?.(err);
      const status = mapped?.status ?? 400;

      let message = mapped?.message || "Upload xatoligi.";
      const em = String(err?.message || "");

      if (em.startsWith("LIMIT_"))
        message = `${em.replace("LIMIT_", "")} uchun fayl limiti oshdi.`;
      else if (em === "INVALID_TYPE") message = "Faqat rasm yuborish mumkin.";
      else if (em === "INVALID_IMAGE") message = "Yaroqsiz rasm fayl.";
      else if (em === "INVALID_SUBFOLDER")
        message = "Upload papka yo'li noto'g'ri.";

      return res.status(status).json({ ok: false, message });
    }
  };
}
