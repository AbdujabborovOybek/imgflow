import fs from "fs";
import path from "path";

export function safeResolve(uploadRoot: string, subfolder: string) {
  const root = path.resolve(uploadRoot);

  const cleaned = String(subfolder || "")
    .replace(/^([/\\])+/, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "");

  const target = path.resolve(path.join(root, cleaned));

  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("INVALID_SUBFOLDER");
  }

  return { root, target };
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}
