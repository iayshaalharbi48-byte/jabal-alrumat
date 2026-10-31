import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const A = load();
const WED = new Date(2026, 10, 4);   // الأربعاء ٤ نوفمبر ٢٠٢٦ — بعد يوم إطلاق القاعدة الجديدة
const OLD = new Date(2026, 9, 20);   // قبل يوم الإطلاق

// نُنشئ يومًا مكتمل الأساس، وتُحدَّد المكمّلات حسب الحاجة.
function fill(d, { core = true, sup = "none", ex = "" } = {}) {
  const k = A.key(d);
  A.S.log[k] = { d: {}, ex };
  const e = A.S.log[k];
  const its = A.dayItems(d);
  for (const it of its) {
    const isCoreItem = A.CORE.has(it.id);
    if (it.type === "prayers") {
      e.d[it.id] = core && isCoreItem ? [true, true, true, true, true] : [false, false, false, false, false];
      continue;
    }
    const done = (isCoreItem && core) || (!isCoreItem && sup === "all");
    if (it.type === "count") e.d[it.id] = done ? (it.target || 1) : 0;
    else if (it.type === "limit") e.d[it.id] = done ? (it.limit || 0) : (it.limit || 0) + 1;
    else e.d[it.id] = done;
  }
  return e;
}

test("القاعدة الجديدة تسري من يوم إطلاقها فقط", () => {
  assert.equal(A.newRule(WED), true);
  assert.equal(A.newRule(OLD), false);
  assert.equal(A.newRule(new Date(2026, 9, 28)), true, "يوم الإطلاق نفسه يدخل في القاعدة");
});

test("الأساس كاملًا ومكمّلات كاملة يعطي ثباتًا", () => {
  fill(WED, { core: true, sup: "all" });
  assert.equal(A.dayState(WED), "up");
});

test("الأساس كاملًا دون مكمّلات يعطي نزولًا", () => {
  fill(WED, { core: true, sup: "none" });
  assert.equal(A.dayState(WED), "down");
});

test("صلاة واحدة ناقصة من الأساس تعطي نزولًا حتى مع كل المكمّلات", () => {
  const e = fill(WED, { core: true, sup: "all" });
  e.d.salah = [true, true, true, true, false];
  assert.equal(A.dayState(WED), "down");
});

test("المرض والسفر يثبّتان الراية ولا يُحسبان", () => {
  fill(WED, { core: false, ex: "sick" });
  assert.equal(A.dayState(WED), "hold");
  fill(WED, { core: false, ex: "travel" });
  assert.equal(A.dayState(WED), "hold");
});

test("العذر الشرعي يُخفي الصلوات والضحى والوتر ولا ينزل بالراية", () => {
  fill(WED, { core: false, ex: "hayd" });
  const ids = A.dayItems(WED).map((i) => i.id);
  for (const h of A.HAYD_HIDE) assert.equal(ids.includes(h), false, `${h} يجب أن يُخفى`);
  assert.equal(A.dayState(WED), "hold");
});

test("القاعدة القديمة: ٧٠٪ من الوِرد تكفي للثبات", () => {
  const its = A.dayItems(OLD);
  const e = A.entry(A.key(OLD), true);
  e.d = {};
  // نُكمل ما يزيد على ٧٠٪ من المهام المجدولة
  const need = Math.ceil(its.length * 0.8);
  its.slice(0, need).forEach((it) => {
    if (it.type === "prayers") e.d[it.id] = [true, true, true, true, true];
    else if (it.type === "count") e.d[it.id] = it.target || 1;
    else if (it.type === "limit") e.d[it.id] = 0;
    else e.d[it.id] = true;
  });
  assert.ok(A.dayPct(OLD) >= 0.7, "النسبة يجب أن تتجاوز ٧٠٪");
  assert.equal(A.dayState(OLD), "up");
});

test("نسبة الأيام المكتملة لا تتجاوز ١", () => {
  fill(WED, { core: true, sup: "all" });
  const p = A.dayPct(WED);
  assert.ok(p >= 0 && p <= 1, `النسبة ${p} خارج المجال`);
});

test("عدّاد أيام المرض والسفر يستثني اليوم المحدَّد", () => {
  A.S.log = {};
  fill(new Date(2026, 10, 1), { ex: "sick" });
  fill(new Date(2026, 10, 2), { ex: "travel" });
  fill(new Date(2026, 10, 3), { ex: "hayd" });
  assert.equal(A.exUsed(WED), 2, "المرض والسفر فقط، والحيض لا يُحسب");
  assert.equal(A.exUsed(new Date(2026, 10, 1), A.key(new Date(2026, 10, 1))), 1, "يستثني نفسه");
});

test("يوم الحيض الجزئي لا يكسر الثبات ولا يصعد بالراية", () => {
  fill(WED, { core: false, ex: "hayd" });
  assert.equal(A.dayState(WED), "hold");
});

test("gapFrac: صفر عند الصفر، وواحد عند ٤٠ فأكثر، ونموه غير متناقص", () => {
  assert.equal(A.gapFrac(0), 0);
  assert.equal(A.gapFrac(40), 1);
  assert.equal(A.gapFrac(100), 1);
  let prev = -1;
  for (let g = 0; g <= 40; g++) {
    const v = A.gapFrac(g);
    assert.ok(v >= prev, `تراجع عند ${g}`);
    prev = v;
  }
});

test("التاريخ الهجري: رمضان لا يُصام فيه تطوّعًا، والعيد لا صيام فيه", () => {
  let ram = null, eid = null;
  for (let t = new Date(2026, 0, 1); t < new Date(2028, 0, 1) && (!ram || !eid); t = A.addDays(t, 1)) {
    const h = A.hNum(t);
    if (!h) continue;
    if (!ram && h.m === 9 && h.d === 5) ram = t;
    if (!eid && h.m === 10 && h.d === 1) eid = t;
  }
  assert.ok(ram && eid, "يجب العثور على أيام للاختبار");
  const r = A.islDay(ram);
  assert.equal(r.ram, true);
  assert.equal(r.fast.length, 0, "لا صيام تطوّع في رمضان");
  assert.equal(A.islDay(eid).noFast, true, "العيد لا صيام فيه");
});

test("الأيام البيض تظهر في الصيام المستحب", () => {
  let whiteDay = null;
  for (let t = new Date(2026, 0, 1); t < new Date(2027, 11, 31); t = A.addDays(t, 1)) {
    const h = A.hNum(t);
    if (h && h.d === 13 && h.m !== 9 && h.m !== 10 && h.m !== 12) { whiteDay = t; break; }
  }
  assert.ok(whiteDay, "يجب العثور على يوم ١٣ من غير رمضان والعيد");
  assert.ok(A.islDay(whiteDay).fast.includes("الأيام البيض"));
});

test("مفتاح اليوم يُحوَّل إلى التاريخ نفسه ذهابًا وإيابًا", () => {
  const k = "2026-11-04";
  assert.equal(A.key(A.parse(k)), k);
});
