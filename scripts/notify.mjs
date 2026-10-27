// جبل الرماة — يرسل تنبيه الفترة المطلوبة إلى ntfy (وإلى تيليجرام إن وُجدت مفاتيحه).
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
const isWeekday = dow <= 4;

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
  if (isWeekday) return `حفظ وجهٍ من ${phase.quran}، ودراسة «${BOOKS[phase.map[dow]]}»`;
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
let title, message, tags;
switch (SLOT) {
  case "fajr":
    title = "قبل الفجر";
    message = bullets(["الوتر", phase ? (isWeekday ? `وجه اليوم من ${phase.quran}` : "تثبيت المحفوظ ومراجعته") : "ورد التلاوة"]);
    tags = ["crescent_moon"];
    break;
  case "morning": {
    title = `صباح ${DAYN[dow]}`;
    const lines = ["أذكار الصباح", "عدد اليوم من ماجريات"];
    const m = masterLine();
    if (m) lines.push(m);
    if (testDay) lines.push("اليوم الاختبار الشامل الشهري");
    message = bullets(lines) + "\n\n" + quote(false);
    tags = ["sunrise"];
    break;
  }
  case "duha":
    title = "الضحى والطلب";
    message = bullets(["صلاة الضحى", phase && isWeekday ? `جلسة «${BOOKS[phase.map[dow]]}»` : "ورد التلاوة"]);
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
  case "night":
    title = "محاسبة اليوم";
    message = "إن لم يبلغ وِردكِ ٧٠٪ نزلتِ غدًا خطوةً عن الجبل. سجّلي ما أنجزتِ، وسجّلي خطواتكِ وصفحاتكِ ومدة الجهاز.\n\n" + quote(true);
    tags = ["memo"];
    break;
  default:
    title = "جبل الرماة";
    message = "تنبيهٌ تجريبي: وصلكِ التنبيه، فالثغر محروس.";
    tags = ["bow_and_arrow"];
}

async function main() {
  let sent = 0;
  if (TOPIC) {
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
    console.error("لم يُضبط NTFY_TOPIC ولا مفاتيح تيليجرام في أسرار المستودع.");
    process.exitCode = 1;
  }
  console.log(`[${SLOT}] ${title}\n${message}`);
}
main();
