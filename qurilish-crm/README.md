# Qurilish mollari CRM (Node.js + Express + MongoDB)

## Ishga tushirish
1. Node.js (18+) va MongoDB o'rnatilgan va ishlab turgan bo'lishi kerak
   (yoki MongoDB Atlas ulanish havolasini oling).
2. Papkada: `npm install`
3. `.env.example` faylini `.env` deb nusxalang va kerak bo'lsa `MONGO_URI` ni o'zgartiring.
4. `npm start` — keyin brauzerda http://localhost:3000

## API
- GET    /api/all                  — hamma ma'lumot
- POST   /api/cats                 — kategoriya qo'shish
- DELETE /api/cats/:id             — kategoriya (va mahsulotlari) o'chirish
- POST   /api/prods                — mahsulot qo'shish
- PATCH  /api/prods/:id            — narx/soni o'zgartirish
- DELETE /api/prods/:id            — mahsulot o'chirish
- POST   /api/prods/:id/sell       — sotish (ombordan ayiradi, kirim yozadi)
- POST   /api/tx, DELETE /api/tx/:id — buxgalteriya yozuvlari
