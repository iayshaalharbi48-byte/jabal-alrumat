// جبل الرماة — يرسل تنبيه الفترة إلى التطبيق نفسه (Web Push)، وإلّا إلى ntfy احتياطًا (وإلى تيليجرام إن وُجدت مفاتيحه).
// الاستعمال: node scripts/notify.mjs <slot>
// slot: fajr | morning | duha | skills | evening | night

const SLOT = process.argv[2] || "morning";
const TOPIC = process.env.NTFY_TOPIC;
const APP_URL = process.env.APP_URL || "";
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

// التاريخ بتوقيت الكويت (UTC+3، بلا توقيت صيفي)
const now = new Date(Date.now() + 3 * 3600 * 1000);
const dow = now.getUTCDay(); // 0 = الأحد
const iso = now.toISOString().slice(0, 10);
const DAYN = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const BOOKS = {
  nuzha: "نزهة النظر", tadwin: "تدوين السنة", ilm: "كتاب العلم من صحيح البخاري",
  jarh: "ضوابط الجرح والتعديل", ilal: "قواعد العلل", muall: "المنهج العلمي في دراسة الحديث المعلّ",
};
const PHASES = [
  { name: "الفصل الأول", start: "2026-11-01", end: "2026-12-31", quran: "البقرة وآل عمران والنساء",
    map: { 0: "nuzha", 1: "ilm", 2: "nuzha", 3: "ilm", 4: "tadwin" } },
  { name: "الفصل الثاني", start: "2027-01-01", end: "2027-03-31", quran: "نصف المائدة وجزء عمّ وجزء تبارك",
    map: { 0: "jarh", 1: "ilal", 2: "jarh", 3: "ilal", 4: "muall" } },
];
const phase = PHASES.find((p) => iso >= p.start && iso <= p.end);

function lastThursday() {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
const testDay = phase && lastThursday() === iso;

function skillsToday() {
  const s = [];
  if (dow === 5 || dow === 6) s.push("الدورة العلمية");
  if (dow === 1) s.push("تعلّم الذكاء الاصطناعي");
  if (dow === 3) s.push("حفظ قصيدة الأسبوع");
  if ([0, 2, 4].includes(dow)) s.push("صناعة المحتوى (إعداد، تصوير، مونتاج)", "الرياضة ساعة");
  if (dow === 3 || dow === 6) s.push("العناية بالشعر والجسم");
  s.push("الكتابة وتحسين الخط", "ممارسة الإنجليزية", "الشطرنج بحسب القدرة", "القراءة الإثرائية");
  return s;
}
function masterLine() {
  if (!phase) return null;
  if (dow <= 4) return `حفظ وجهٍ من ${phase.quran}، ودراسة «${BOOKS[phase.map[dow]]}»`;
  if (dow === 6) return `حفظ وجهٍ ومراجعة من ${phase.quran}`;
  return `تثبيت المحفوظ ومراجعته من ${phase.quran}`;
}


// عبارات العزم — تتبدّل يومًا بعد يوم
const QUOTES = [
  ["سنظلّ في جبل الرماة، وخلفنا صوتُ النبيّ ﷺ يهزّنا: لا تبرحوا", "من عهدكِ لنفسكِ", 1],
  ["شُدّي مِئزرَكِ، فهذا أوانُ جِدّكِ وزمانُ مجدِكِ", "من عهدكِ لنفسكِ", 1],
  ["إذا سوّفتِ نِمتِ، وأدلجَ الناس", "من عهدكِ لنفسكِ", 1],
  ["إن رأيتمونا تخطفنا الطير فلا تبرحوا مكانكم هذا حتى أرسل إليكم", "رواه البخاري", 1],
  ["من خاف أدلج، ومن أدلج بلغ المنزل، ألا إنّ سلعة الله غالية، ألا إنّ سلعة الله الجنة", "رواه الترمذي", 1],
  ["احرص على ما ينفعك، واستعن بالله، ولا تعجز", "رواه مسلم", 0],
  ["أحبّ الأعمال إلى الله أدومها وإن قلّ", "متفقٌ عليه", 0],
  ["نعمتان مغبونٌ فيهما كثيرٌ من الناس: الصحة والفراغ", "رواه البخاري", 1],
  ["لا يُستطاع العلمُ براحة الجسم", "يحيى بن أبي كثير", 0],
  ["إذا غامرتَ في شرفٍ مَرومِ  ·  فلا تقنعْ بما دون النجومِ", "المتنبي", 0],
  ["على قدر أهل العزم تأتي العزائمُ  ·  وتأتي على قدر الكرام المكارمُ", "المتنبي", 0],
  ["ولم أرَ في عيوب الناس شيئًا  ·  كنقص القادرين على التمامِ", "المتنبي", 1],
  ["بقدر الكدّ تُكتسبُ المعالي  ·  ومن طلب العلا سهر الليالي", "يُنسب إلى الشافعي", 0],
  ["وما نيلُ المطالب بالتمنّي  ·  ولكن تؤخذ الدنيا غِلابا", "أحمد شوقي", 0],
];
const dayN = Math.floor(now.getTime() / 864e5);
function quote(firm, shift = 0) {
  const list = QUOTES.filter((q) => !firm || q[2]);
  const q = list[(dayN + shift) % list.length];
  return `«${q[0]}»\n— ${q[1]}`;
}

const bullets = (a) => a.map((x) => "• " + x).join("\n");
const ar = (n) => Number(n).toLocaleString("ar-EG");
const DATA_TOKEN = process.env.DATA_TOKEN;
const DATA_REPO = process.env.DATA_REPO;
const yIso = new Date(now.getTime() - 864e5).toISOString().slice(0, 10);

async function getSummary() {
  if (!DATA_TOKEN || !DATA_REPO) return null;
  try {
    const r = await fetch(`https://api.github.com/repos/${DATA_REPO}/contents/progress.json`, {
      headers: { Authorization: `Bearer ${DATA_TOKEN}`, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) { console.log("data:", r.status); return null; }
    const j = await r.json();
    return JSON.parse(Buffer.from(j.content, "base64").toString("utf8")).summary || null;
  } catch (e) { console.log("data error", e.message); return null; }
}

function build(sum) {
  let title, message, tags;
  switch (SLOT) {
    case "fajr":
      title = "قبل الفجر";
      message = bullets(["الوتر", phase ? (dow === 5 ? "تثبيت المحفوظ ومراجعته" : `وجه اليوم من ${phase.quran}`) : "ورد التلاوة"]);
      tags = ["crescent_moon"];
      break;
    case "morning": {
      title = `صباح ${DAYN[dow]}`;
      const lines = ["أذكار الصباح", "عدد اليوم من ماجريات"];
      const m = masterLine();
      if (m) lines.push(m);
      if (testDay) lines.push("اليوم الاختبار الشامل الشهري");
      let head = "";
      if (sum) {
        if (sum.date === yIso && sum.pct < 0.7) head = "نزلتِ أمس خطوةً عن الجبل، فاصعدي اليوم إلى موضعكِ.\n\n";
        else if (sum.date === yIso) head = "ثبتِّ أمس على الجبل، فلا تبرحي مكانكِ اليوم.\n\n";
        else if (sum.date < yIso) head = "لم تسجّلي أمس شيئًا في جبل الرماة.\n\n";
      }
      message = head + bullets(lines) + "\n\n" + quote(false);
      tags = ["sunrise"];
      break;
    }
    case "duha":
      title = "الضحى والطلب";
      message = bullets(["صلاة الضحى", phase && dow <= 4 ? `جلسة «${BOOKS[phase.map[dow]]}»` : "ورد التلاوة"]);
      tags = ["books"];
      break;
    case "skills":
      title = "ثغور المهارات";
      message = bullets(skillsToday()) + "\n\n" + quote(false, 5);
      tags = ["dart"];
      break;
    case "evening":
      title = "أذكار المساء";
      message = "حان وقت أذكار المساء.\n\n" + quote(false, 9);
      tags = ["city_sunset"];
      break;
    case "night": {
      title = "محاسبة اليوم";
      if (sum && sum.date === iso) {
        const pct = Math.round(sum.pct * 100);
        const rem = (sum.remaining || []).slice(0, 7);
        message = `أتممتِ ${ar(sum.done)} من ${ar(sum.total)} (${ar(pct)}٪).`;
        if (rem.length) message += "\nبقي عليكِ:\n" + bullets(rem);
        if (sum.ok !== undefined) message += sum.ok ? "\n\nأتممتِ الأساس ونصف المكمّلات، فأنتِ ثابتةٌ على الجبل." : `\n\n${sum.need || "لم يكتمل الأساس بعد"}، وإلّا نزلتِ خطوة.\n\n` + quote(true);
        else message += sum.pct >= 0.7 ? "\n\nبلغتِ ٧٠٪، فأنتِ ثابتةٌ على الجبل." : `\n\nبقي ${ar(70 - pct)}٪ حتى لا تنزلي خطوة.\n\n` + quote(true);
        if ((sum.todos || []).length) message += "\n\nومن مهامّ اليوم:\n" + bullets(sum.todos.slice(0, 5)) + "\n(ما لم يتمّ انقليه إلى الغد)";
      } else {
        message = (sum ? "لم تسجّلي شيئًا اليوم بعد. " : "سجّلي ما أنجزتِ في جبل الرماة. ") + "إن لم تُتمّي الأساس ونصف المكمّلات نزلتِ خطوةً عن الجبل.\n\n" + quote(true);
      }
      if (dow === 4 && sum && sum.week) {
        const w = sum.week;
        message += `\n\nحصاد الأسبوع: معدّل ${ar(Math.round(w.avg * 100))}٪، ثبات ${ar(w.ups)} أيام، ونزول ${ar(w.downs)}.`;
        if (w.weak && w.weak !== w.best) message += `\nأضعف الثغور: ${w.weak}، فاجعليه همّ الأسبوع المقبل.`;
      }
      tags = ["memo"];
      break;
    }
    default:
      title = "جبل الرماة";
      message = sum ? `تنبيهٌ تجريبي: وصلكِ التنبيه، والمزامنة تعمل (آخر تسجيل ${sum.date}).` : "تنبيهٌ تجريبي: وصلكِ التنبيه، فالثغر محروس.";
      tags = ["bow_and_arrow"];
  }
  return { title, message, tags };
}

// تنبيهات التطبيق نفسه (Web Push): المفاتيح والاشتراكات في المستودع الخاص
async function dataFile(path) {
  const r = await fetch(`https://api.github.com/repos/${DATA_REPO}/contents/${path}?t=${Date.now()}`, {
    headers: { Authorization: `Bearer ${DATA_TOKEN}`, Accept: "application/vnd.github+json" },
  });
  if (!r.ok) return null;
  const j = await r.json();
  return { sha: j.sha, data: JSON.parse(Buffer.from(j.content, "base64").toString("utf8")) };
}
async function sendPush(title, message) {
  if (!DATA_TOKEN || !DATA_REPO) return 0;
  let webpush;
  try { webpush = (await import("web-push")).default; } catch (e) { console.log("web-push غير مثبّت"); return 0; }
  const keys = await dataFile("push/vapid.json"), subs = await dataFile("push/subs.json");
  if (!keys || !subs || !(subs.data.subs || []).length) { console.log("push: لا اشتراكات"); return 0; }
  webpush.setVapidDetails(keys.data.subject, keys.data.publicKey, keys.data.privateKey);
  const url = (APP_URL || "./") + "#today";
  const payload = JSON.stringify({ title, body: message, tag: SLOT, url });
  let ok = 0; const dead = new Set();
  for (const s of subs.data.subs) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 3 * 3600, urgency: "high" }); ok++; }
    catch (e) { console.log("push:", e.statusCode || e.message); if (e.statusCode === 404 || e.statusCode === 410) dead.add(s.endpoint); }
  }
  if (dead.size) {
    subs.data.subs = subs.data.subs.filter((x) => !dead.has(x.endpoint));
    await fetch(`https://api.github.com/repos/${DATA_REPO}/contents/push/subs.json`, {
      method: "PUT", headers: { Authorization: `Bearer ${DATA_TOKEN}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify({ message: "حذف اشتراكٍ منتهٍ", sha: subs.sha, content: Buffer.from(JSON.stringify(subs.data, null, 1)).toString("base64") }),
    }).catch(() => {});
  }
  console.log("push: أُرسل إلى", ok);
  return ok;
}

async function main() {
  const sum = await getSummary();
  const { title, message, tags } = build(sum);
  let sent = await sendPush(title, message);
  // ntfy احتياطٌ فقط: يُستعمل إن لم يصل التنبيه إلى التطبيق
  if (TOPIC && !sent) {
    const body = { topic: TOPIC, title, message, tags, priority: 4 };
    if (APP_URL) body.click = APP_URL;
    const r = await fetch("https://ntfy.sh/", { method: "POST", body: JSON.stringify(body) });
    console.log("ntfy:", r.status);
    if (!r.ok) process.exitCode = 1; else sent++;
  }
  if (TG_TOKEN && TG_CHAT) {
    const text = `${title}\n${message}${APP_URL ? `\n\n${APP_URL}` : ""}`;
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text}),
    });
    console.log("telegram:", r.status);
    if (!r.ok) process.exitCode = 1; else sent++;
  }
  if (!sent && !TOPIC && !(TG_TOKEN && TG_CHAT)) {
    console.error("لا اشتراك في تنبيهات التطبيق، ولم يُضبط NTFY_TOPIC ولا مفاتيح تيليجرام.");
    process.exitCode = 1;
  }
  console.log(`[${SLOT}] ${title}\n${message}`);
}
main();
