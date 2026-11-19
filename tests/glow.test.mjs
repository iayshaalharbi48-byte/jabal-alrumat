import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const A = load();
const ids = (d) => A.dayItems(d).map((i) => i.id);
const BEFORE = new Date(2026, 10, 19); // الخميس ١٩ نوفمبر — قبل الرحلة
const DAY1 = new Date(2026, 10, 20);   // الجمعة ٢٠ نوفمبر — اليوم الأول
const SAT = new Date(2026, 10, 21);
const MON = new Date(2026, 10, 23);
const END = new Date(2027, 1, 18);     // اليوم الحادي والتسعون

test("بنود رحلة التوهّج لا تظهر قبل يومها ولا تمسّ ما مضى", () => {
  assert.ok(!ids(BEFORE).some((i) => i.startsWith("g_")));
});

test("الثوابت اليومية تظهر من اليوم الأول", () => {
  for (const id of ["g_am", "g_pm", "g_posture", "g_water", "g_plate", "g_body", "g_sleep"])
    assert.ok(ids(DAY1).includes(id), id);
});

test("صور المتابعة يوم الجمعة، وغسل الشعر السبت والاثنين والأربعاء", () => {
  assert.ok(ids(DAY1).includes("g_photo"));
  assert.ok(!ids(SAT).includes("g_photo"));
  assert.ok(ids(SAT).includes("g_hair"));
  assert.ok(ids(MON).includes("g_hair"));
  assert.ok(!ids(DAY1).includes("g_hair"));
});

test("المكمّلات تبدأ بعد وصول الطلب (٢٧ نوفمبر)", () => {
  assert.ok(!ids(DAY1).includes("g_supp"));
  assert.ok(ids(new Date(2026, 10, 27)).includes("g_supp"));
});

test("العناية العامّة تُطفأ من اليوم الأول، وهدف الخطوات يرتفع", () => {
  assert.ok(!ids(SAT).includes("selfcare"));
  const w = (d) => A.dayItems(d).find((i) => i.id === "walk").target;
  assert.equal(w(BEFORE), 5000);
  assert.equal(w(DAY1), 8000);
  assert.equal(w(new Date(2026, 11, 11)), 10000);
});

test("الرحلة تنتهي بعد تسعين يومًا", () => {
  assert.ok(!ids(END).some((i) => i.startsWith("g_")));
});

test("بنود الرحلة مكمّلات لا من الأساس", () => {
  assert.ok(!A.isCore({ id: "g_am" }));
});

test("الترحيل من sv=7 يضيف بنود الرحلة ويطفئ العناية العامّة من يومها فقط", () => {
  const old = A.blank();
  old.sv = 7;
  old.items = old.items.filter((i) => !i.id.startsWith("g_"));
  for (const it of old.items) if (it.id === "selfcare" || it.id === "walk") delete it.chg;
  const s = A.migrate(old);
  assert.equal(s.sv, 8);
  assert.ok(s.items.some((i) => i.id === "g_am"));
  const sc = s.items.find((i) => i.id === "selfcare");
  assert.equal(A.at(sc, "2026-11-18").on, true);
  assert.equal(A.at(sc, "2026-11-20").on, false);
  assert.equal(A.at(s.items.find((i) => i.id === "walk"), "2026-11-20").target, 8000);
});
