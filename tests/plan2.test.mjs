import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const A = load();
const BEFORE = new Date(2026, 10, 10); // الثلاثاء ١٠ نوفمبر — قبل خطّة التركيز
const AFTER = new Date(2026, 10, 17);  // الثلاثاء ١٧ نوفمبر — بعدها
const ids = (d) => A.dayItems(d).map((i) => i.id);

test("الشطرنج والذكاء الاصطناعي والشعر تبقى في الماضي وتُرفع من الخطّة الجديدة", () => {
  assert.ok(ids(BEFORE).includes("chess"));
  assert.ok(!ids(AFTER).includes("chess"));
  assert.ok(!ids(new Date(2026, 10, 16)).includes("ai"), "الإثنين بعد الخطّة");
  assert.ok(ids(new Date(2026, 10, 9)).includes("ai"), "الإثنين قبلها");
  assert.ok(!ids(new Date(2026, 10, 18)).includes("poetry"));
});

test("كتلة الماجستير من الأساس بعد الخطّة فقط", () => {
  assert.ok(!ids(BEFORE).includes("masterblock"));
  assert.ok(ids(AFTER).includes("masterblock"));
  assert.ok(A.isCore({ id: "masterblock" }));
});

test("الاستعادة ثلاثة أوجه بعد الخطّة، والماضي على وجهٍ واحد", () => {
  assert.equal(A.dayItems(BEFORE).find((i) => i.id === "hifz").target, 1);
  const h = A.dayItems(AFTER).find((i) => i.id === "hifz");
  assert.equal(h.target, 3);
  assert.equal(h.t, "استعادة المحفوظ");
});

test("المراجعة يومية بعد الخطّة، والقناة كلّ يوم", () => {
  assert.ok(!ids(BEFORE).includes("tathbit"));
  assert.ok(ids(AFTER).includes("tathbit"));
  assert.ok(ids(AFTER).includes("content"));
  assert.equal(A.dayItems(AFTER).find((i) => i.id === "content").t, "قناة اليوتيوب");
});

test("يومٌ قديمٌ مكتمل لا ينقلب نزولًا بسبب الخطّة الجديدة", () => {
  const k = A.key(BEFORE);
  A.S.log[k] = { d: {} };
  for (const it of A.dayItems(BEFORE)) {
    if (it.type === "prayers") A.S.log[k].d[it.id] = [true, true, true, true, true];
    else if (it.type === "count") A.S.log[k].d[it.id] = it.target || 1;
    else if (it.type === "limit") A.S.log[k].d[it.id] = it.limit || 0;
    else A.S.log[k].d[it.id] = true;
  }
  assert.equal(A.dayState(BEFORE), "up");
});

test("الترحيل يضيف التغييرات المؤرّخة إلى حالةٍ قديمة (sv=4) دون مساس الماضي", () => {
  const old = A.blank();
  old.sv = 4;
  for (const it of old.items) delete it.chg;
  old.items = old.items.filter((i) => i.id !== "masterblock");
  const s = A.migrate(old);
  assert.equal(s.sv, 5);
  const chess = s.items.find((i) => i.id === "chess");
  assert.equal(A.at(chess, "2026-11-11").on, true);
  assert.equal(A.at(chess, "2026-11-12").on, false);
  const mb = s.items.find((i) => i.id === "masterblock");
  assert.equal(mb.on, false);
  assert.equal(A.at(mb, "2026-11-12").on, true);
  assert.equal(s.phases[0].target, 120);
});

test("التبديل من الإعدادات يسري من يومه ولا يعيد كتابة التاريخ", () => {
  const it = { id: "x", on: true, days: [0, 1], chg: [{ from: "2026-11-20", on: false }] };
  A.setFrom(it, { on: false }, "2026-11-15");
  assert.equal(A.at(it, "2026-11-14").on, true);
  assert.equal(A.at(it, "2026-11-15").on, false);
  A.setFrom(it, { on: true }, "2026-11-16");
  assert.equal(A.at(it, "2026-11-25").on, true, "التغيير اللاحق المجدول لا يغلب اختيارها الأحدث");
  assert.equal(A.at(it, "2026-11-15").on, false);
});
