require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { Schema } = mongoose;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let seq = 0;
const newId = () => Date.now() * 1000 + (seq++ % 1000);
const opt = { versionKey: false };

const Cat = mongoose.model('Cat', new Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#e8590c' },
  icon: { type: String, default: '🧱' },
  image: { type: String, default: '' }
}, opt));

const Prod = mongoose.model('Prod', new Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  cat: { type: Number, required: true },
  color: { type: String, default: '#ffffff' },
  cn: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'dona' },
  brand: { type: String, default: '' },
  image: { type: String, default: '' }
}, opt));

const Tx = mongoose.model('Tx', new Schema({
  id: { type: Number, unique: true, required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  amount: { type: Number, required: true, min: 0 },
  note: { type: String, default: '' },
  date: { type: String, required: true }
}, opt));

const w = fn => (req, res) => fn(req, res).catch(e => res.status(400).json({ error: e.message }));
const list = M => M.find().select('-_id').lean();

app.get('/api/all', w(async (req, res) => {
  const [cats, prods, tx] = await Promise.all([list(Cat), list(Prod), list(Tx)]);
  res.json({ cats, prods, tx });
}));

// Kategoriyalar
app.post('/api/cats', w(async (req, res) => {
  const { name, color, icon, image } = req.body;
  await Cat.create({ name, color, icon, image, id: newId() });
  res.json({ ok: true });
}));
app.delete('/api/cats/:id', w(async (req, res) => {
  await Prod.deleteMany({ cat: +req.params.id });
  await Cat.deleteOne({ id: +req.params.id });
  res.json({ ok: true });
}));

// Mahsulotlar
app.post('/api/prods', w(async (req, res) => {
  const { name, cat, color, cn, price, qty, unit, brand, image } = req.body;
  if (!(await Cat.exists({ id: cat }))) throw new Error("Kategoriya topilmadi");
  await Prod.create({ name, cat, color, cn, price, qty, unit, brand, image, id: newId() });
  res.json({ ok: true });
}));
app.patch('/api/prods/:id', w(async (req, res) => {
  const { price, qty } = req.body;
  await Prod.updateOne({ id: +req.params.id }, { price, qty }, { runValidators: true });
  res.json({ ok: true });
}));
app.delete('/api/prods/:id', w(async (req, res) => {
  await Prod.deleteOne({ id: +req.params.id });
  res.json({ ok: true });
}));
app.post('/api/prods/:id/sell', w(async (req, res) => {
  const n = +req.body.qty;
  if (!(n > 0)) throw new Error("Soni noto'g'ri");
  const p = await Prod.findOneAndUpdate(
    { id: +req.params.id, qty: { $gte: n } }, { $inc: { qty: -n } }, { new: true });
  if (!p) throw new Error('Omborda yetarli emas!');
  await Tx.create({
    id: newId(), type: 'in', amount: n * p.price,
    note: `Sotuv: ${p.name} × ${n} ${p.unit}`, date: new Date().toISOString().slice(0, 10)
  });
  res.json({ ok: true });
}));

// Buxgalteriya
app.post('/api/tx', w(async (req, res) => {
  const { type, amount, note, date } = req.body;
  await Tx.create({ type, amount, note, date, id: newId() });
  res.json({ ok: true });
}));
app.delete('/api/tx/:id', w(async (req, res) => {
  await Tx.deleteOne({ id: +req.params.id });
  res.json({ ok: true });
}));

async function seed() {
  if (await Cat.countDocuments()) return;
  const cs = [["Sement","#868e96","🏗️"],["G'isht","#e8590c","🧱"],["Metall mahsulotlar","#495057","🔩"],["Qum va shag'al","#e0a458","🏖️"],["Beton mahsulotlari","#adb5bd","⬜"],["Yog'och mahsulotlari","#a9742b","🪵"],["Izolyatsiya","#f9c51a","🧶"],["Bo'yoq va kimyoviy moddalar","#1c7ed6","🎨"],["Asbob-uskunalar","#f08c00","🛠️"]];
  const ids = {};
  for (const [name, color, icon] of cs) { const id = newId(); ids[name] = id; await Cat.create({ id, name, color, icon }); }
  const ps = [["Cement (50 kg)","Sement","Cement","#868e96","Kulrang",62000,120,"qop"],["G'isht (bitta)","G'isht","","#e8590c","Qizil",1200,5000,"dona"],["Armatura (12 mm)","Metall mahsulotlar","","#495057","Qora",18000,300,"dona"],["Qum (1 m³)","Qum va shag'al","","#e0a458","Sariq",110000,40,"m³"],["Shag'al (1 m³)","Qum va shag'al","","#868e96","Kulrang",120000,35,"m³"],["Taxta (50x150)","Yog'och mahsulotlari","","#d9a35f","Och jigarrang",65000,80,"dona"],["Gipsokarton","Izolyatsiya","Knauf","#f1f3f5","Oq",54000,60,"dona"],["Gidroizolyatsiya","Bo'yoq va kimyoviy moddalar","Sika","#1c7ed6","Ko'k",210000,25,"chelak"]];
  for (const [name, c, brand, color, cn, price, qty, unit] of ps)
    await Prod.create({ id: newId(), name, cat: ids[c], brand, color, cn, price, qty, unit });
}

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qurilish_crm')
  .then(async () => {
    await seed();
    app.listen(PORT, () => console.log(`CRM ishga tushdi: http://localhost:${PORT}`));
  })
  .catch(e => { console.error('MongoDB ulanmadi:', e.message); process.exit(1); });
