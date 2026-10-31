// اختبار دخان في متصفح حقيقي: يفتح الصفحة، ويضغط صلاة، ويتأكد من بقائها بعد التحديث.
// يتطلب Playwright (مثبّت في البيئة). يُتخطّى إن لم يتوفر.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
let chromium = null;
try { ({ chromium } = require("playwright")); } catch { chromium = null; }
const here = dirname(fileURLToPath(import.meta.url));
const INDEX = "file://" + join(here, "..", "index.html");

test("الصفحة تُحمَّل دون أخطاء، وتبقى الصلاة المضغوطة بعد التحديث", { skip: !chromium && "Playwright غير متوفر" }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const t0 = Date.now();
    await page.goto(INDEX, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('#view [data-act="pray"]', { timeout: 15000 });
    const loadMs = Date.now() - t0;
    assert.ok(loadMs < 8000, `التحميل بطيء: ${loadMs} مللي ثانية`);

    const first = page.locator('#view [data-act="pray"][data-i="0"]').first();
    const before = await first.getAttribute("aria-pressed");
    await first.click();
    await page.waitForTimeout(300);
    const after = await page.locator('#view [data-act="pray"][data-i="0"]').first().getAttribute("aria-pressed");
    assert.notEqual(after, before, "الضغط على الصلاة يجب أن يغيّر حالتها");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector('#view [data-act="pray"]', { timeout: 15000 });
    const kept = await page.locator('#view [data-act="pray"][data-i="0"]').first().getAttribute("aria-pressed");
    assert.equal(kept, after, "الحالة يجب أن تبقى بعد التحديث");

    assert.deepEqual(errors, [], "لا يجب أن تُرمى أخطاء في الصفحة");
  } finally {
    await browser.close();
  }
});

test("شريط عدم الاتصال يظهر عند انقطاع الشبكة ويختفي عند عودتها", { skip: !chromium && "Playwright غير متوفر" }, async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(INDEX, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#net", { state: "attached", timeout: 15000 });
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    assert.equal(await page.locator("#net").isHidden(), false, "الشريط يجب أن يظهر دون اتصال");
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    assert.equal(await page.locator("#net").isHidden(), true, "الشريط يجب أن يختفي عند العودة");
  } finally {
    await browser.close();
  }
});
