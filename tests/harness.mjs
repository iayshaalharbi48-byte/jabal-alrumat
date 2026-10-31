// يحمّل منطق التطبيق في بيئة معزولة دون متصفح، ويُرجع الدوال النقية للاختبار.
// لا يغيّر ملف التطبيق: يقرأ src/app.html ويضيف عبارة return قبل إغلاق الحزمة.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "..", "src", "app.html"), "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error("لم يُعثر على وسم <script> في src/app.html");
let src = m[1];
const close = src.lastIndexOf("})();");
if (close < 0) throw new Error("لم يُعثر على إغلاق الحزمة");

const EXPORTS = [
  "S", "key", "parse", "addDays", "today", "dayState", "dayParts", "dayPct", "score",
  "streak", "climb", "exOf", "dayItems", "exUsed", "gapFrac", "islDay", "hNum",
  "scheduled", "phaseOf", "quoteFor", "entry", "newRule", "isCore", "EX_CAP", "SUMMIT",
  "HAYD_HIDE", "CORE", "RULE_FROM",
];
src = src.slice(0, close) + `return {${EXPORTS.join(",")}};\n` + src.slice(close);

// وسيط عام: أي خاصية تُرجع وسيطًا آخر، والاستدعاء لا يفعل شيئًا.
function stub() {
  const fn = function () { return stub(); };
  return new Proxy(fn, {
    get(_t, p) {
      if (p === Symbol.toPrimitive) return () => "";
      if (p === "then") return undefined;
      if (p === Symbol.iterator) return function* () {};
      if (p === "length") return 0;
      return stub();
    },
    set() { return true; },
    apply() { return stub(); },
    construct() { return stub(); },
  });
}

const storage = new Map();
const ctx = {
  console: { log() {}, warn() {}, error() {} },
  document: stub(),
  window: stub(),
  navigator: { userAgent: "test", serviceWorker: undefined },
  location: { hash: "", href: "", reload() {} },
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
  fetch: () => Promise.reject(new Error("no network in tests")),
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  requestAnimationFrame: () => 0,
  matchMedia: () => ({ matches: false }),
  Intl, Date, Math, JSON, Map, Set, Promise, Symbol, Array, Object, String, Number, RegExp, Error,
  URL, TextEncoder, TextDecoder, btoa: (s) => Buffer.from(s, "binary").toString("base64"), atob: (s) => Buffer.from(s, "base64").toString("binary"),
};
ctx.globalThis = ctx;

export function load() {
  const context = vm.createContext(ctx);
  return vm.runInContext(src, context, { filename: "app.html" });
}
