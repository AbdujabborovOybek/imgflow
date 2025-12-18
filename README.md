# imgflow

Express.js uchun tasvir yuklashni sodda va xavfsiz qiladigan, **TypeScript-first** middleware. `multer` (memory storage) va `sharp` ustiga qurilgan; siz faqat qaysi papkaga va qanday parametrlar bilan saqlashni aytasiz, qolganini `imgflow` bajaradi.

## Nima qiladi?

- `multer` yuklagan `buffer`larni o‘qiydi
- faqat rasm fayllarini qabul qiladi
- keshlash/resize/formatlashni `sharp` orqali bajaradi
- noyob nomlar generatsiya qiladi (`uuid`)
- papkalarni avtomatik yaratadi
- fayllarni diskka yozadi
- natijaviy nomlarni `req.body` ichiga joylaydi (string yoki string[] ko‘rinishida)

---

## O‘rnatish

```bash
npm install imgflow
# express ham kerak bo‘ladi (peerDependency)
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

## Asosiy ishlash ketma-ketligi

1. **multer** `multipart/form-data`ni o‘qiydi va fayllarni xotirada (`buffer`) saqlaydi.
2. **imgflow** bu bufferlarni tekshiradi, qayta ishlaydi va diskka yozadi.
3. `req.body[field]` qiymati `maxCount` ga qarab **string** yoki **string[]** bo‘ladi.

---

## Tezkor start (cover + images)

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

Natija tuzilmasi:

```
uploads/
  posts/
    covers/
      <uuid>.webp
    images/
      <uuid>.png
```

---

## Multersiz yagona middleware (imgflowUpload)

`imgflowUpload` — `multer.memoryStorage()` + `upload.fields(...)` + `imgflow(...)` ni bitta massivda qaytaradi.

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

## Konfiguratsiya: `ImgflowOptions`

```ts
imgflow({
  uploadRoot: "uploads",          // majburiy: ildiz papka
  fields: { ... },                // majburiy: har bir field uchun sozlama
  fileName?: ({ field, ext }) => string, // ixtiyoriy: fayl nomi generatori
  onError?: (err) => ({ status?: number; message: string }) // ixtiyoriy: javobni sozlash
});
```

### `fields` (FieldConfig)

Har bir field ikki ko‘rinishda bo‘lishi mumkin:

```ts
fields: {
  // qisqa yozuv: faqat papka (maxCount = 1)
  avatar: "avatars",

  // to‘liq sozlama
  cover: {
    dir: "posts/covers",   // majburiy
    maxCount: 1,           // default: 1
    resize: { ... },       // ixtiyoriy (qarang: Resize)
    output: { ... },       // ixtiyoriy (qarang: Output)
  },
}
```

- **`dir`**: `uploadRoot` ichidagi nisbiy papka. Noto‘g‘ri yo‘l (`..` yoki absolyut) bo‘lsa, `INVALID_SUBFOLDER`.
- **`maxCount`**: multer limitiga mos ishlaydi; limit oshsa `LIMIT_<field>` xatosi.
- **Natija**: `maxCount=1` → `req.body[field]` **string**, aks holda **string[]**.

### Resize (`resize`)

```ts
{
  width?: number;
  height?: number;
  fit?: "inside" | "cover" | "contain" | "fill" | "outside";
  withoutEnlargement?: boolean; // default: true
}
```

- Faqat `width` yoki `height` berilsa ham nisbat saqlanadi (`fit="inside"` default).
- `fit="cover"`: avatarlar uchun markazdan croplab beradi.
- `withoutEnlargement=true`: kichik rasmni kattalashtirmaydi (default).

Misollar:

```ts
resize: { width: 1200 }                             // proporsiyani saqlagan holda kenglik
resize: { width: 256, height: 256, fit: "cover" }  // kvadrat avatar
resize: { width: 1600, withoutEnlargement: false } // kerak bo‘lsa kattalashtiradi
```

### Output (`output`)

```ts
{
  format?: "jpeg" | "png" | "webp" | "avif"; // default: original format
  quality?: number;          // jpeg/webp/avif uchun sifat
  compressionLevel?: number; // png uchun (0..9)
}
```

Misollar:

```ts
output: { format: "webp", quality: 80 }     // webp + sifat
output: { quality: 90 }                     // asl format, faqat sifat (jpeg/webp/avif)
output: { format: "png", compressionLevel: 9 } // maksimal siqish (png)
```

### Fayl nomini sozlash (`fileName`)

```ts
imgflow({
  ...,
  fileName: ({ field, ext }) => `${field}-${Date.now()}.${ext}`,
});
```

- Default: `uuidv4()` + original yoki tanlangan formatdagi kengaytma.
- `ext` — yakuniy format (`jpeg`/`png`/`webp`/`avif`/original).

### Xatolarni boshqarish (`onError`)

```ts
imgflow({
  ...,
  onError: (err) => {
    if (err.message === "INVALID_TYPE")
      return { status: 415, message: "Faqat rasm qabul qilinadi." };
    return { status: 400, message: "Yuklashda xatolik." };
  },
});
```

Standart xabarlar:

- `LIMIT_<field>` → `"<field> uchun fayl limiti oshdi."`
- `INVALID_TYPE` → `Faqat rasm yuborish mumkin.`
- `INVALID_IMAGE` → `Yaroqsiz rasm fayl.`
- `INVALID_SUBFOLDER` → `Upload papka yo'li noto'g'ri.`
- Default status: `400`.

---

## Frontenddan yuborish

```js
const fd = new FormData();
fd.append("cover", coverFile);
images.forEach((img) => fd.append("images", img));

await fetch("/post/create", { method: "POST", body: fd });
```

---

## Natija va foydalanish

```js
// maxCount=1 bo'lgan field
console.log(req.body.cover);   // "b12c3d.webp"

// bir nechta fayl
console.log(req.body.images);  // ["a1.png", "b2.png"]
```

Diskdagi fayllarni serverga ulash:

```ts
import express from "express";
app.use("/uploads", express.static("uploads"));
// /uploads/posts/covers/<uuid>.webp
```

---

## Litsenziya

ISC
