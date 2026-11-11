import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./harness.mjs";

const A = load();
const BEFORE = new Date(2026, 10, 10); // الثلاثاء ١٠ نوفمبر — قبل خطّة التركيز
const AFTER = new Date(2026, 10, 17);  // الثلاثاء ١٧ نوفمبر — بعدها
const ids = (d) => A.dayItems(d).map((i) => i.id);

test("الشطرنج والذكاء الاصطناعي والشعر باقية بعد الخطّة", () => {
  assert.ok(ids(AFTER).includes("chess"));
  assert.ok(ids(new Date(2026, 10, 16)).includes("ai"));
  assert.ok(ids(new Date(2026, 10, 18)).includes("poetry"));
});

test("كتلة الماجستير من الأساس بعد الخطّة فقط", () => {
  assert.ok(!ids(BEFORE).includes("masterblock"));
  assert.ok(ids(AFTER).includes("masterblock"));
  assert.ok(A.isCore({ id: "masterblock" }));
});

test("الحفظ الجديد وجهٌ واحد كما كان، والتثبيت يوم الجمعة", () => {
  const h = A.dayItems(AFTER).find((i) => i.id === "hifz");
  assert.equal(h.target, 1);
  assert.equal(h.t, "حفظ وجهٍ جديد");
  assert.ok(!ids(AFTER).includes("tathbit"));
  assert.ok(ids(new Date(2026, 10, 20)).includes("tathbit"));
});

test("القناة الأحد والثلاثاء والخميس بعد الخطّة", () => {
  assert.ok(ids(AFTER).includes("content"));
  assert.ok(!ids(new Date(2026, 10, 18)).includes("content"), "الأربعاء");
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

test("الترحيل من sv=4 يضيف الكتلة والقناة ولا يمسّ الحفظ والمهارات", () => {
  const old = A.blank();
  old.sv = 4;
  for (const it of old.items) delete it.chg;
  old.items = old.items.filter((i) => i.id !== "masterblock");
  const s = A.migrate(old);
  assert.equal(s.sv, 7);
  assert.equal(A.at(s.items.find((i) => i.id === "chess"), "2026-11-12").on, true);
  const mb = s.items.find((i) => i.id === "masterblock");
  assert.equal(A.at(mb, "2026-11-12").on, true);
  assert.equal(A.at(s.items.find((i) => i.id === "content"), "2026-11-12").t, "قناة اليوتيوب");
  assert.equal(s.phases[0].target, 60);
});

test("من حُمِّلت عنده نسخة sv=5 يعود إليه الحفظ الجديد والمهارات", () => {
  const st = A.blank();
  st.sv = 5;
  const P = "2026-11-12";
  const set = (id, c) => (st.items.find((i) => i.id === id).chg = [c]);
  set("hifz", { from: P, t: "استعادة المحفوظ", target: 3 });
  set("chess", { from: P, on: false });
  set("ai", { from: P, on: false });
  set("poetry", { from: P, on: false });
  set("tathbit", { from: P, days: [0, 1, 2, 3, 4, 5, 6] });
  st.phases[0].quran = "الأجزاء الستّة الأولى من محفوظكِ";
  st.phases[0].target = 120;
  const s = A.migrate(st);
  assert.equal(s.sv, 7);
  for (const id of ["hifz", "chess", "ai", "poetry", "tathbit"]) assert.ok(!s.items.find((i) => i.id === id).chg, id);
  assert.equal(s.phases[0].quran, "البقرة وآل عمران والنساء");
  assert.equal(s.phases[0].target, 60);
  assert.ok(A.at(s.items.find((i) => i.id === "masterblock"), P).on);
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

test("من حُمِّلت عنده القناة يوميّة تعود إلى الأحد والثلاثاء والخميس", () => {
  const st = A.blank();
  st.sv = 6;
  st.items.find((i) => i.id === "content").chg = [{ from: "2026-11-12", t: "قناة اليوتيوب", days: [0, 1, 2, 3, 4, 5, 6] }];
  const s = A.migrate(st);
  assert.equal(JSON.stringify(A.at(s.items.find((i) => i.id === "content"), "2026-11-12").days), "[0,2,4]");
});
