# imgflow

**imgflow** is a simple, clean, and TypeScript-first image upload middleware for **Express.js**.

It is built on top of:
- **multer** (memory storage)
- **sharp** (image processing)

## Main idea

> **You only describe folders and options. imgflow does the rest.**

imgflow will automatically:
- read uploaded files from memory
- validate images
- resize if needed
- keep original image format by default
- generate unique filenames
- create folders automatically
- save files to disk
- put filenames into `req.body`

---

## Table of Contents

- Installation
- Basic Concept
- Quick Start
- Upload Types
  - Single file
  - Multiple files (array)
  - Multiple different fields
- Using Multer Inside imgflow
- Configuration
- Resize Options
- Output Format & Quality
- Frontend Examples
- Serving Uploaded Files
- Author
- License

---

## Installation

```bash
npm install imgflow
```

> `multer`, `sharp`, and `uuid` are installed automatically.

---

## Basic Concept (Very Important)

imgflow works **after multer**.

1. **multer** reads files from `multipart/form-data`
2. Files are stored in memory (`buffer`)
3. **imgflow**:
   - reads buffers
   - processes images
   - saves them to disk
   - writes filenames into `req.body`

### Result rule

- `maxCount = 1` → `req.body[field]` is a **string**
- `maxCount > 1` → `req.body[field]` is an **array of strings**

---

## Quick Start (Cover + Images)

### Backend (Express)

```ts
import express from "express";
import multer from "multer";
import { imgflow } from "imgflow";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post(
  "/post/create",

  // 1) Multer reads files
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 10 }
  ]),

  // 2) imgflow processes images
  imgflow({
    uploadRoot: "uploads",
    fields: {
      cover: {
        dir: "posts/covers",
        maxCount: 1,
        resize: { width: 1024 }
      },
      images: {
        dir: "posts/images",
        maxCount: 10,
        resize: { width: 1600 }
      }
    }
  }),

  // 3) Controller
  (req, res) => {
    res.json({
      cover: req.body.cover,
      images: req.body.images
    });
  }
);

app.listen(3000);
```

### Result folders

```
uploads/
  posts/
    covers/
      a1b2c3.webp
    images/
      x1.png
      x2.jpg
```

---

## Upload Types

### 1) Single file (`single`)

Use when you need **only one file** (avatar, cover, logo).

#### Backend

```ts
upload.single("avatar"),
imgflow({
  uploadRoot: "uploads",
  fields: {
    avatar: {
      dir: "avatars",
      maxCount: 1,
      resize: { width: 256, height: 256, fit: "cover" }
    }
  }
})
```

#### Frontend

```js
const fd = new FormData();
fd.append("avatar", file);
```

#### Result

```js
req.body.avatar // "avatar-uuid.jpg"
```

---

### 2) Multiple files, same field (`array`)

Use for galleries.

#### Backend

```ts
upload.array("images", 10),
imgflow({
  uploadRoot: "uploads",
  fields: {
    images: {
      dir: "gallery",
      maxCount: 10,
      resize: { width: 1600 }
    }
  }
})
```

#### Frontend

```js
const fd = new FormData();
files.forEach(file => fd.append("images", file));
```

#### Result

```js
req.body.images // ["img1.jpg", "img2.png"]
```

---

### 3) Multiple different fields (`fields`) ⭐ RECOMMENDED

Most real APIs use this.

Example:
- `cover` (1)
- `images` (many)
- `avatar` (1)

#### Backend

```ts
upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "avatar", maxCount: 1 }
]),

imgflow({
  uploadRoot: "uploads",
  fields: {
    cover: { dir: "covers", maxCount: 1, resize: { width: 1024 } },
    images: { dir: "images", maxCount: 10, resize: { width: 1600 } },
    avatar: { dir: "avatars", maxCount: 1, resize: { width: 256, height: 256, fit: "cover" } }
  }
})
```

---

## Using Multer Inside imgflow (Advanced & Clean)

If you **don’t want to use multer in your routes**, you can wrap it.

### Usage

```ts
import { imgflowUpload } from "imgflow";

app.post(
  "/post/create",
  imgflowUpload({
    uploadRoot: "uploads",
    fields: {
      cover: { dir: "covers", maxCount: 1 },
      images: { dir: "images", maxCount: 10 }
    }
  }),
  controller.create
);
```

Now:
- no `multer` import in route
- one clean middleware

---

## Configuration

### imgflow(options)

```ts
imgflow({
  uploadRoot: string,
  fields: Record<string, FieldConfig>,
  fileName?: (ctx) => string,
  onError?: (err) => { status?: number; message: string }
})
```

---

## Resize Options

```ts
resize: {
  width?: number
  height?: number
  fit?: "inside" | "cover" | "contain" | "fill" | "outside"
  withoutEnlargement?: boolean
}
```

### Examples

#### Keep aspect ratio (safe)

```ts
resize: { width: 1024 }
```

#### Exact size with crop (avatar)

```ts
resize: { width: 256, height: 256, fit: "cover" }
```

---

## Output Format & Quality

### Default behavior
- Format: original
- Quality: sharp default

### Force WebP

```ts
output: { format: "webp" }
```

### Force WebP + quality

```ts
output: { format: "webp", quality: 80 }
```

### Only quality (keep format)

```ts
output: { quality: 85 }
```

---

## Frontend Example (Full)

```js
const fd = new FormData();
fd.append("cover", coverFile);
images.forEach(img => fd.append("images", img));

await fetch("/post/create", {
  method: "POST",
  body: fd
});
```

---

## Serving Uploaded Files

```ts
app.use("/uploads", express.static("uploads"));
```

Access example:
```
/uploads/posts/covers/abc.webp
```

---

## Author

**Abdujabborov Oybek**  
Full-Stack JavaScript Developer

- 🌐 https://abdujabborov.uz/
- 📸 https://www.instagram.com/abdujabborov_uz/
- 💬 https://t.me/AbdujabborovOybek

---

## License

ISC
