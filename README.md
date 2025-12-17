# imgflow

**imgflow** is a simple, minimal, and configurable Express middleware for image uploads, built on top of **multer** and **sharp**.

It is designed with one core idea:

> **You define folders — imgflow handles everything else.**

imgflow automatically:
- creates upload directories
- processes images safely
- optionally resizes images
- keeps the original image format by default
- generates unique filenames
- injects saved filenames into `req.body`

---

## Features

- Extremely simple API
- TypeScript-first (types included)
- Works with both `import` and `require`
- Keeps original image format by default
- Optional resize with aspect-ratio preserved
- Automatic directory creation
- Secure path handling
- Powered by `sharp`

---

## Installation

```bash
npm install imgflow
```

> `sharp`, `multer`, and `uuid` are installed automatically.

---

## Basic Usage

### 1) Setup Multer (memory storage)

```ts
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage()
});
```

### 2) Use `imgflow` middleware

```ts
import { imgflow } from "imgflow";

app.post(
  "/post/create",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "images", maxCount: 10 }
  ]),
  imgflow({
    uploadRoot: "uploads",
    fields: {
      cover: "posts/covers",
      images: "posts/images"
    }
  }),
  (req, res) => {
    res.json({
      cover: req.body.cover,
      images: req.body.images
    });
  }
);
```

---

## Author

**Abdujabborov Oybek**  
Full-Stack JavaScript Developer

- Website: https://abdujabborov.uz/
- Instagram: https://www.instagram.com/abdujabborov_uz/
- Telegram: https://t.me/AbdujabborovOybek

---

## License

ISC
