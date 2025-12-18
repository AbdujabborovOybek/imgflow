# imgflow

A simple, TypeScript-first image upload middleware for Express.js. Built on top of `multer` (memory storage) and `sharp`. You describe where and how files should be saved; `imgflow` handles the rest.

## What does it do?

- reads `multer` in-memory buffers
- accepts images only
- resizes/optimizes with `sharp`
- generates unique filenames (`uuid`)
- creates folders automatically
- writes files to disk
- puts the resulting filenames into `req.body` (string or string[])

---

## Installation

```bash
npm install imgflow
# express is required (peerDependency)
npm install express
```

ESM:

```ts
import { imgflow, imgflowUpload } from "imgflow";
```

CommonJS:

```js
const { imgflow, imgflowUpload } = require("imgflow");
```

---

## How it works

1. **multer** reads `multipart/form-data` and keeps files in memory (`buffer`).
2. **imgflow** validates and processes those buffers, then saves them to disk.
3. `req.body[field]` becomes a **string** or **string[]** depending on `maxCount`.

---

## Quick start (cover + gallery)

```ts
import express from "express";
import multer from "multer";
import { imgflow } from "imgflow";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  "/post/create",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  imgflow({
    uploadRoot: "uploads",
    fields: {
      cover: { dir: "posts/covers", maxCount: 1, resize: { width: 1024 } },
      images: { dir: "posts/images", maxCount: 10, resize: { width: 1600 } },
    },
  }),
  (req, res) => {
    res.json({ cover: req.body.cover, images: req.body.images });
  }
);

app.listen(3000);
```

Resulting structure:

```
uploads/
  posts/
    covers/
      <uuid>.webp
    images/
      <uuid>.png
```

---

## One clean middleware (imgflowUpload)

`imgflowUpload` bundles `multer.memoryStorage()` + `upload.fields(...)` + `imgflow(...)` into a single array of middlewares.

```ts
import { imgflowUpload } from "imgflow";

app.post(
  "/profile",
  imgflowUpload({
    uploadRoot: "uploads",
    fields: {
      avatar: { dir: "avatars", maxCount: 1, resize: { width: 256, height: 256, fit: "cover" } },
      gallery: { dir: "gallery", maxCount: 12, resize: { width: 1600 } },
    },
  }),
  (req, res) => res.json(req.body)
);
```

---

## Configuration: `ImgflowOptions`

```ts
imgflow({
  uploadRoot: "uploads",          // required: root folder
  fields: { ... },                // required: per-field config
  fileName?: ({ field, ext }) => string, // optional: custom filename
  onError?: (err) => ({ status?: number; message: string }) // optional: custom response
});
```

### `fields` (FieldConfig)

Each field can be defined in two ways:

```ts
fields: {
  // short form: only folder (maxCount = 1)
  avatar: "avatars",

  // full config
  cover: {
    dir: "posts/covers",   // required
    maxCount: 1,           // default: 1
    resize: { ... },       // optional (see Resize)
    output: { ... },       // optional (see Output)
  },
}
```

- **`dir`**: relative folder inside `uploadRoot`. Invalid paths (`..` or absolute) throw `INVALID_SUBFOLDER`.
- **`maxCount`**: aligned with multer’s limit; exceeding it throws `LIMIT_<field>`.
- **Result type**: `maxCount=1` → `req.body[field]` is a **string**, otherwise a **string[]**.

### Resize (`resize`)

```ts
{
  width?: number;
  height?: number;
  fit?: "inside" | "cover" | "contain" | "fill" | "outside";
  withoutEnlargement?: boolean; // default: true
}
```

- Only `width` or `height` still preserves aspect ratio (`fit="inside"` by default).
- `fit="cover"` crops from center—great for avatars.
- `withoutEnlargement=true` prevents upscaling smaller images (default).

Examples:

```ts
resize: { width: 1200 }                             // maintain aspect ratio by width
resize: { width: 256, height: 256, fit: "cover" }  // square avatar
resize: { width: 1600, withoutEnlargement: false } // allow upscaling if needed
```

### Output (`output`)

```ts
{
  format?: "jpeg" | "png" | "webp" | "avif"; // default: original format
  quality?: number;          // jpeg/webp/avif quality
  compressionLevel?: number; // png only (0..9)
}
```

Examples:

```ts
output: { format: "webp", quality: 80 }         // webp + quality
output: { quality: 90 }                         // keep original format, tweak quality
output: { format: "png", compressionLevel: 9 }  // max compression for png
```

### Custom filenames (`fileName`)

```ts
imgflow({
  ...,
  fileName: ({ field, ext }) => `${field}-${Date.now()}.${ext}`,
});
```

- Default: `uuidv4()` with the final format extension.
- `ext` is the resulting format (`jpeg`/`png`/`webp`/`avif`/original).

### Error handling (`onError`)

```ts
imgflow({
  ...,
  onError: (err) => {
    if (err.message === "INVALID_TYPE")
      return { status: 415, message: "Only images are accepted." };
    return { status: 400, message: "Upload failed." };
  },
});
```

Built-in messages:

- `LIMIT_<field>` → `"<field> fayl limiti oshdi."`
- `INVALID_TYPE` → `Faqat rasm yuborish mumkin.`
- `INVALID_IMAGE` → `Yaroqsiz rasm fayl.`
- `INVALID_SUBFOLDER` → `Upload papka yo'li noto'g'ri.`
- Default status: `400`.

---

## Reading results and serving files

```js
// maxCount = 1
console.log(req.body.cover);   // "b12c3d.webp"

// multiple files
console.log(req.body.images);  // ["a1.png", "b2.png"]
```

Serve uploaded files:

```ts
import express from "express";
app.use("/uploads", express.static("uploads"));
// /uploads/posts/covers/<uuid>.webp
```

---

## License

ISC
