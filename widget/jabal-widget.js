// جبل الرماة — أداة الشاشة الرئيسية والحزمة المتكدّسة (تطبيق Scriptable)
// تقرأ ملخّص يومكِ من Firebase بمعرّفٍ خاصّ بكِ، فلا تحتاج رمزًا ولا كلمة مرور.
// يُضاف المعرّف تلقائيًّا حين تنسخين النصّ من إعدادات جبل الرماة وأنتِ داخلةٌ في حسابكِ.

const WID = "";   // معرّف الأداة (يملؤه التطبيق عند النسخ)
const APP = "https://iayshaalharbi48-byte.github.io/jabal-alrumat/";
const FB_KEY = "AIzaSyCla8le1BfABTgph4TeGFefS-ZO2m_z1oU";
const FB_DOC = "https://firestore.googleapis.com/v1/projects/jabal-alrumat/databases/(default)/documents/widgets/";
const KC = "jabal-wid";
const fm = FileManager.local();
const dir = fm.joinPath(fm.cacheDirectory(), "jabal-widget");
if (!fm.fileExists(dir)) fm.createDirectory(dir);

const ar = (n) => Number(n).toLocaleString("ar-EG");
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const h = now.getHours() + now.getMinutes() / 60;
const night = h < 4.75 || h >= 18.25;

// ---------- المعرّف ----------
const wid = () => WID || (Keychain.contains(KC) ? Keychain.get(KC) : "");
async function askWid() {
  const a = new Alert();
  a.title = "معرّف الأداة";
  a.message = "انسخيه من جبل الرماة: الإعدادات ← أداة الشاشة الرئيسية ← «نسخ معرّف الأداة».";
  a.addTextField("المعرّف", "");
  a.addAction("حفظ");
  a.addCancelAction("إلغاء");
  if ((await a.presentAlert()) === -1) return;
  const t = a.textFieldValue(0).trim();
  if (t) Keychain.set(KC, t);
}

// ---------- البيانات: وثيقة الأداة في Firebase ----------
let SPRITE = null;
async function loadSummary() {
  const cache = fm.joinPath(dir, "summary.json"), imgP = fm.joinPath(dir, "text.png");
  const fromCache = () => { if (fm.fileExists(imgP)) SPRITE = fm.readImage(imgP); return fm.fileExists(cache) ? JSON.parse(fm.readString(cache)) : null; };
  const id = wid();
  if (!id) return null;
  try {
    const r = new Request(FB_DOC + encodeURIComponent(id) + "?key=" + FB_KEY);
    r.timeoutInterval = 15;
    const j = await r.loadJSON();
    const code = r.response.statusCode;
    if (code === 200 && j.fields && j.fields.s) {
      const sum = JSON.parse(j.fields.s.stringValue);
      fm.writeString(cache, JSON.stringify(sum));
      if (j.fields.img && j.fields.img.stringValue) {
        try { SPRITE = Image.fromData(Data.fromBase64String(j.fields.img.stringValue)); fm.writeImage(imgP, SPRITE); } catch (e) {}
      } else if (fm.fileExists(imgP)) SPRITE = fm.readImage(imgP);
      return sum;
    }
    if (code === 404 || code === 403) return { _err: "wid" };
  } catch (e) {}
  return fromCache();
}
async function loadArt() {
  const name = night ? "mist-night.webp" : "mist-day.webp";
  const p = fm.joinPath(dir, name);
  if (fm.fileExists(p)) { const img = fm.readImage(p); if (img) return img; }
  try { const img = await new Request(APP + "art/" + name).loadImage(); fm.writeImage(p, img); return img; } catch (e) { return null; }
}

// ---------- الرسم: الجبل والراية ----------
const IMG_W = 564, IMG_H = 1006, PEAK = [250, 446];
const RIDGE = [[250,446],[270,450],[290,456],[310,462],[330,472],[350,490],[370,506],[395,520],[420,532],[445,541],[470,551],[495,563],[520,577],[545,590]];
function ridgeAt(f) {
  const L = [0];
  for (let i = 1; i < RIDGE.length; i++) L.push(L[i - 1] + Math.hypot(RIDGE[i][0] - RIDGE[i - 1][0], RIDGE[i][1] - RIDGE[i - 1][1]));
  const t = f * L[L.length - 1];
  for (let i = 1; i < L.length; i++) if (t <= L[i]) {
    const k = (t - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [RIDGE[i - 1][0] + k * (RIDGE[i][0] - RIDGE[i - 1][0]), RIDGE[i - 1][1] + k * (RIDGE[i][1] - RIDGE[i - 1][1])];
  }
  return RIDGE[RIDGE.length - 1];
}
const gapFrac = (g) => g <= 0 ? 0 : Math.min(1, Math.pow(g / 40, 0.55));

function drawFlag(ctx, x, y, s, ghost) {
  const pole = new Path();
  pole.addRect(new Rect(x - 1.2 * s, y - 34 * s, 2.4 * s, 34 * s));
  ctx.addPath(pole);
  ctx.setFillColor(new Color(night ? "#F3EFFF" : "#2A2554", ghost ? 0.25 : 0.95));
  ctx.fillPath();
  const fl = new Path();
  fl.move(new Point(x + 1.2 * s, y - 34 * s));
  fl.addLine(new Point(x + 22 * s, y - 30 * s));
  fl.addLine(new Point(x + 16 * s, y - 25 * s));
  fl.addLine(new Point(x + 22 * s, y - 20 * s));
  fl.addLine(new Point(x + 1.2 * s, y - 18 * s));
  fl.closeSubpath();
  ctx.addPath(fl);
  ctx.setFillColor(new Color(night ? "#9C96EC" : "#4B4E9E", ghost ? 0.22 : 1));
  ctx.fillPath();
  if (!ghost) {
    ctx.setFillColor(new Color("#F6D99A"));
    ctx.fillEllipse(new Rect(x + 6.5 * s, y - 29 * s, 5 * s, 5 * s));
  }
}
function background(art, W, H, gap, sprite, cell) {
  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = true;
  ctx.respectScreenScale = true;
  ctx.setFillColor(new Color(night ? "#2B2560" : "#E5E1F0"));
  ctx.fillRect(new Rect(0, 0, W, H));
  const px = W * (W > H ? 0.3 : 0.3), py = H * (W > H ? 0.56 : 0.5);   // موضع القمّة في الأداة
  // أصغر تكبيرٍ يغطّي الأداة كلّها والقمّة في موضعها
  const scale = Math.max((W - px) / (IMG_W - PEAK[0]), px / PEAK[0], py / PEAK[1], (H - py) / (IMG_H - PEAK[1]));
  const iw = IMG_W * scale, ih = IMG_H * scale;
  const ox = px - PEAK[0] * scale, oy = py - PEAK[1] * scale;
  if (art) ctx.drawImageInRect(art, new Rect(ox, oy, iw, ih));
  // ستارٌ خفيف يعين على القراءة
  ctx.setFillColor(new Color(night ? "#1C1748" : "#FFFFFF", night ? 0.28 : 0.22));
  ctx.fillRect(new Rect(0, 0, W, H));
  // ستارٌ متدرّج في أسفل الأداة حيث النصوص
  for (let i = 0; i < 40; i++) {   // تدرّجٌ ناعم بلا خطوط ظاهرة
    ctx.setFillColor(new Color(night ? "#1C1748" : "#FFFFFF", night ? 0.011 : 0.008));
    ctx.fillRect(new Rect(0, H * (0.45 + i * 0.0125), W, H));
  }
  const fs = Math.max(0.7, W / 340);
  if (gap > 0) drawFlag(ctx, px, py, fs, true);
  const [rx, ry] = ridgeAt(gapFrac(gap));
  drawFlag(ctx, ox + rx * scale, oy + ry * scale, fs, false);
  // نصوص الأداة بخطّ ثمانية، رسمها التطبيق نفسه
  if (sprite && cell) ctx.drawImageAtPoint(sprite, new Point(-cell[0], -cell[1]));
  return ctx.getImage();
}

// ---------- النصوص ----------
function texts(sum) {
  // نمطٌ بسيط: سطرٌ خافت وسطرٌ واحدٌ ظاهر
  if (!sum) return { sub: "انسخي النصّ من إعدادات التطبيق", main: "جبل الرماة", gap: 0 };
  if (sum._err) return { sub: "افتحي التطبيق وادخلي حسابكِ", main: "لم تُنشأ بعد", gap: 0 };
  const gap = Math.max(0, (sum.summit || 100) - (sum.pos ?? sum.summit ?? 100));
  if (sum.date !== todayKey) return { sub: "لم تسجّلي اليوم بعد", main: "لا تبرحي مكانكِ", gap };
  if (sum.ok) return { sub: sum.next ? "ثمّ " + sum.next : "", main: "ثبتِّ اليوم", gap };
  const sub = sum.nc ? "بقي " + ar(sum.nc) + " من الأساس" : sum.ns ? "بقي " + ar(sum.ns) + " مكمّلة" : "";
  return { sub, main: sum.next || "أتمّي وِردكِ", gap };
}

function txt(stack, s, size, opts = {}) {
  const t = stack.addText(s);
  t.font = opts.bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  t.textColor = new Color(night ? "#F6F2FF" : "#1F2433", opts.alpha ?? 1);
  t.rightAlignText();
  t.lineLimit = opts.lines || 1;
  t.minimumScaleFactor = 0.75;
  if (opts.shadow) { t.shadowColor = new Color(night ? "#000000" : "#FFFFFF", 0.5); t.shadowRadius = 3; }
  return t;
}
function row(parent) { const s = parent.addStack(); s.layoutHorizontally(); s.addSpacer(); return s; }

async function build(family) {
  const sum = await loadSummary();
  const T = texts(sum);
  const w = new ListWidget();
  w.url = APP + "#today";
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  if (family && family.startsWith("accessory")) {
    w.addAccessoryWidgetBackground = family === "accessoryCircular";
    const a = (t, b) => { const x = w.addText(t); x.font = b ? Font.boldSystemFont(14) : Font.systemFont(11); x.rightAlignText(); x.lineLimit = 1; x.minimumScaleFactor = 0.7; };
    if (T.sub) a(T.sub);
    a(T.main, true);
    return w;
  }

  const big = family === "medium" || family === "large";
  const W = big ? 728 : 340, H = family === "large" ? 760 : 340;
  // لوح النصوص بخطّ ثمانية: الصفوف ٠ نهار/اليوم، ١ ليل/اليوم، ٢ نهار/يوم جديد، ٣ ليل/يوم جديد؛ والأعمدة صغيرة ثم متوسطة
  const sprite = sum && !sum._err && family !== "large" ? SPRITE : null;
  const rIdx = (sum && sum.date === todayKey ? 0 : 2) + (night ? 1 : 0);
  const cell = sprite ? [big ? 340 : 0, rIdx * 340] : null;
  w.backgroundImage = background(await loadArt(), W, H, T.gap, sprite, cell);
  w.setPadding(14, 14, 16, 18);
  if (sprite) return w;
  // احتياط: خطّ النظام بالترتيب نفسه
  w.addSpacer();
  if (T.sub) txt(row(w), T.sub, big ? 12 : 11, { alpha: 0.68 });
  txt(row(w), T.main, big ? 21 : 18, { bold: true, lines: big ? 1 : 2 });
  return w;
}

// ---------- التشغيل ----------
if (config.runsInWidget) {
  Script.setWidget(await build(config.widgetFamily));
} else {
  if (!wid()) await askWid();
  const m = new Alert();
  m.title = "جبل الرماة";
  m.message = "اختاري معاينة، ثم أضيفي الأداة من الشاشة الرئيسية.";
  m.addAction("معاينة صغيرة");
  m.addAction("معاينة متوسطة");
  m.addAction("معاينة شاشة القفل");
  m.addAction("تغيير المعرّف");
  m.addCancelAction("إغلاق");
  const c = await m.presentSheet();
  if (c === 0) (await build("small")).presentSmall();
  else if (c === 1) (await build("medium")).presentMedium();
  else if (c === 2) (await build("accessoryRectangular")).presentAccessoryRectangular();
  else if (c === 3) await askWid();
}
Script.complete();
