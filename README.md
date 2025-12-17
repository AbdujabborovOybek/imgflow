# imgflow

**imgflow** is a simple and configurable Express middleware for image uploads, built on top of **multer** and **sharp**.

It lets you define **where images should be stored** (folders), and it automatically:

- creates directories
- processes images (resize if needed)
- keeps original format by default
- saves files with unique names
- injects filenames into `req.body`

You only configure paths — everything else just works.

---

## Features

- Very simple API
- TypeScript support (types included)
- Works with both `import` and `require`
- Keeps original image format by default
- Optional resize (width / height / fit)
- Automatic directory creation
- Safe file handling
- Powered by `sharp`

---

## Installation

```bash
npm install imgflow
```

> `sharp`, `multer`, and `uuid` are installed automatically.

---

## Basic Usage

### 1) Setup multer (memory storage)

```ts
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
});
```

### 2) Use `imgflow` middleware

```ts
import { imgflow } from "imgflow";

app.post(
  "/post/create",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  imgflow({
    uploadRoot: "uploads",
    fields: {
      cover: "posts/covers",
      images: "posts/images",
    },
  }),
  (req, res) => {
    res.json({
      cover: req.body.cover,
      images: req.body.images,
    });
  }
);
```

### Example result

```
uploads/
  posts/
    covers/
      8c1f3d9e.webp
    images/
      a12f9a.png
      b91dd2.jpg
```

---

## Configuration

### `imgflow(options)`

```ts
imgflow({
  uploadRoot: string,
  fields: Record<string, FieldConfig>,
  fileName?: (ctx) => string,
  onError?: (error) => { status?: number; message: string }
})
```

---

## `uploadRoot`

Root directory where all files will be stored.

```ts
uploadRoot: "uploads";
```

You can also use an absolute path:

```ts
uploadRoot: path.resolve("uploads");
```

---

## `fields`

Defines how each form field should be handled.

### Simple form (just directory)

```ts
fields: {
  avatar: "avatars",
  cover: "posts/covers"
}
```

### Advanced form (resize, limits)

```ts
fields: {
  cover: {
    dir: "posts/covers",
    resize: { width: 1024 }
  },
  images: {
    dir: "posts/images",
    maxCount: 10,
    resize: { width: 1600 }
  }
}
```

---

## Field Options

```ts
{
  dir: string;            // target directory
  maxCount?: number;      // default: 1
  resize?: {
    width?: number;
    height?: number;
    fit?: "inside" | "cover" | "contain" | "fill" | "outside";
    withoutEnlargement?: boolean;
  };
  output?: {
    format?: "jpeg" | "png" | "webp" | "avif";
    quality?: number;
  };
}
```

---

## Resize Behavior (Important)

- If **only width or height** is provided → aspect ratio is preserved
- Default `fit`:
  - `inside` → no cropping (safe default)
  - `cover` → used when both width and height are provided

Example:

```ts
resize: {
  width: 1024;
}
```

---

## Output Format & Quality

### Default behavior

- Format: **original image format**
- Quality: **sharp default**

### Force WebP with quality

```ts
output: {
  format: "webp",
  quality: 82
}
```

### Only change quality (keep original format)

```ts
output: {
  quality: 80;
}
```

---

## Custom File Names (optional)

```ts
imgflow({
  uploadRoot: "uploads",
  fields: {
    avatar: "avatars",
  },
  fileName: ({ field, ext }) => {
    return `${field}-${Date.now()}.${ext}`;
  },
});
```

---

## Error Handling (optional)

```ts
imgflow({
  uploadRoot: "uploads",
  fields: { cover: "covers" },
  onError: (err) => ({
    status: 400,
    message: err.message,
  }),
});
```

---

## Import vs Require

### ESM

```ts
import { imgflow } from "imgflow";
```

### CommonJS

```js
const { imgflow } = require("imgflow");
```

Both are supported.

---

## Requirements

- Node.js 18+
- Express 4 or 5
- Multer memory storage (recommended)

---

## Philosophy

> **Configure paths, not logic.**

`imgflow` is designed to stay out of your way.  
You define folders — it handles everything else.

---

## License

ISC
