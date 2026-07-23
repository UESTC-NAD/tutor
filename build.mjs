// 扫描 lessons/ 下的教辅 HTML，生成首页 index.html
// 用法：node build.mjs
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LESSONS = join(ROOT, 'lessons');
const MANIFEST = join(LESSONS, 'manifest.json');

const SITE_TITLE = '狗哥的教辅库';
const SITE_SUB = '公式与交互都能正常使用的在线版本';

// 学科关键词，用于自动归类（manifest.json 里可手动覆盖）
const SUBJECTS = {
  数学: ['三角形', '向量', '函数', '复数', '导数', '立体几何', '数列', '概率', '解析几何'],
  化学: ['化学', '摩尔', '离子', '化学方程式', '元素', '溶液', '氧化', '有机'],
  物理: ['电场', '磁场', '加速度', '动量', '受力分析', '电路', '光学'],
};

function guessSubject(text) {
  let best = '其他', bestScore = 0;
  for (const [name, words] of Object.entries(SUBJECTS)) {
    const score = words.reduce((n, w) => n + (text.split(w).length - 1), 0);
    if (score > bestScore) { bestScore = score; best = name; }
  }
  return bestScore >= 3 ? best : '其他';
}

function extractTitle(html, fallback) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : fallback;
}

// 统计题目数量：按 class 精确分词，避免 q 误匹配到 q-num、qhead 等
function countQuestions(html) {
  const tally = new Map();
  for (const m of html.matchAll(/class="([^"]*)"/g)) {
    for (const cls of m[1].trim().split(/\s+/)) {
      if (cls) tally.set(cls, (tally.get(cls) || 0) + 1);
    }
  }
  // 各文件的题号标记约定不一，取其中出现最多的那个
  const markers = ['q', 'qno', 'q-num', 'qhead'];
  return Math.max(0, ...markers.map(m => tally.get(m) || 0));
}

function features(html) {
  const f = [];
  if (/<mjx-container/.test(html)) f.push('公式已预渲染');
  else if (/MathJax|katex/i.test(html)) f.push('公式实时渲染');
  if (/addEventListener|onclick=/.test(html)) f.push('含交互按钮');
  return f;
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};

const items = readdirSync(LESSONS)
  .filter(n => /\.html?$/i.test(n))
  .map(name => {
    const full = join(LESSONS, name);
    const html = readFileSync(full, 'utf8');
    const text = html.replace(/<[^>]+>/g, ' ');
    const over = manifest[name] || {};
    return {
      name,
      href: 'lessons/' + encodeURIComponent(name),
      title: over.title || extractTitle(html, name.replace(/\.html?$/i, '')),
      subject: over.subject || guessSubject(text),
      note: over.note || '',
      count: countQuestions(html),
      tags: features(html),
      mtime: statSync(full).mtime,
    };
  })
  .sort((a, b) => b.mtime - a.mtime);

// 首次运行时生成一份 manifest 模板，方便手动改标题/学科/备注
if (!existsSync(MANIFEST)) {
  const tpl = Object.fromEntries(items.map(i => [i.name, { title: i.title, subject: i.subject, note: '' }]));
  writeFileSync(MANIFEST, JSON.stringify(tpl, null, 2), 'utf8');
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const subjects = [...new Set(items.map(i => i.subject))];

const cards = items.map(i => `      <a class="card" href="${i.href}" data-subject="${esc(i.subject)}" data-search="${esc((i.title + ' ' + i.subject + ' ' + i.note).toLowerCase())}">
        <div class="card-top"><span class="badge s-${esc(i.subject)}">${esc(i.subject)}</span><time>${fmt(i.mtime)}</time></div>
        <h2>${esc(i.title)}</h2>
        ${i.note ? `<p class="note">${esc(i.note)}</p>` : ''}
        <div class="meta">${i.count > 0 ? `<span>约 ${i.count} 题</span>` : ''}${i.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      </a>`).join('\n');

const filters = ['全部', ...subjects]
  .map((s, n) => `<button type="button" class="chip${n === 0 ? ' on' : ''}" data-filter="${esc(s)}">${esc(s)}</button>`)
  .join('');

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${esc(SITE_TITLE)}</title>
<style>
  :root{
    --bg:#f4f6f9; --card:#fff; --ink:#20304d; --muted:#5c6b82; --line:#e3e7ee;
    --brand:#2f6fb0; --brand-soft:#eaf2fa; --shadow:0 1px 3px rgba(20,40,80,.06);
  }
  @media (prefers-color-scheme: dark){
    :root{ --bg:#12161d; --card:#1b212b; --ink:#e6ebf2; --muted:#9aa7bb; --line:#2a323f;
           --brand:#6aa9e8; --brand-soft:#1e2a3a; --shadow:0 1px 3px rgba(0,0,0,.3); }
  }
  *{box-sizing:border-box}
  body{
    margin:0; background:var(--bg); color:var(--ink);
    font-family:"PingFang SC","Microsoft YaHei","Hiragino Sans GB",-apple-system,Segoe UI,Roboto,sans-serif;
    line-height:1.7; -webkit-text-size-adjust:100%;
  }
  .wrap{max-width:1000px; margin:0 auto; padding:0 18px 70px;
        padding-left:max(18px,env(safe-area-inset-left)); padding-right:max(18px,env(safe-area-inset-right))}
  header.top{
    background:linear-gradient(135deg,#23324c,#33507a); color:#fff;
    padding:30px 22px calc(26px + env(safe-area-inset-top)); padding-top:calc(30px + env(safe-area-inset-top));
    box-shadow:0 6px 22px rgba(35,50,76,.18); margin-bottom:22px;
  }
  header.top .inner{max-width:1000px; margin:0 auto}
  header.top h1{margin:0 0 4px; font-size:26px; letter-spacing:.5px}
  header.top p{margin:0; color:#d7e2f2; font-size:14.5px}
  .tools{display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:0 0 18px}
  #q{
    flex:1 1 220px; min-height:44px; padding:10px 14px; font-size:16px;
    border:1px solid var(--line); border-radius:12px; background:var(--card); color:var(--ink);
    -webkit-appearance:none;
  }
  #q:focus{outline:2px solid var(--brand); outline-offset:1px}
  .chips{display:flex; flex-wrap:wrap; gap:8px}
  .chip{
    min-height:44px; padding:0 16px; font-size:15px; cursor:pointer;
    border:1px solid var(--line); border-radius:22px; background:var(--card); color:var(--ink);
    font-family:inherit; -webkit-tap-highlight-color:transparent;
  }
  .chip.on{background:var(--brand); color:#fff; border-color:var(--brand)}
  .grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px}
  .card{
    display:block; text-decoration:none; color:inherit; background:var(--card);
    border:1px solid var(--line); border-radius:14px; padding:16px 18px 14px; box-shadow:var(--shadow);
    transition:transform .12s ease, box-shadow .12s ease; -webkit-tap-highlight-color:transparent;
  }
  .card:active{transform:scale(.985)}
  @media (hover:hover){ .card:hover{box-shadow:0 6px 18px rgba(20,40,80,.12); border-color:var(--brand)} }
  .card-top{display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px}
  .badge{font-size:12.5px; font-weight:700; padding:2px 10px; border-radius:6px; background:var(--brand-soft); color:var(--brand)}
  .badge.s-数学{background:#eaf2fa; color:#2f6fb0}
  .badge.s-化学{background:#eaf6ee; color:#2e7d46}
  .badge.s-物理{background:#fdf3e2; color:#a15c00}
  @media (prefers-color-scheme: dark){
    .badge.s-数学{background:#1e2a3a; color:#6aa9e8}
    .badge.s-化学{background:#172a20; color:#6cc38a}
    .badge.s-物理{background:#2e2417; color:#d9a05b}
  }
  time{font-size:12.5px; color:var(--muted)}
  .card h2{margin:0; font-size:17px; line-height:1.5; font-weight:600}
  .card .note{margin:6px 0 0; font-size:14px; color:var(--muted)}
  .meta{display:flex; flex-wrap:wrap; gap:6px; margin-top:10px}
  .meta span{font-size:12.5px; color:var(--muted); border:1px solid var(--line); border-radius:6px; padding:1px 8px}
  .empty{display:none; text-align:center; color:var(--muted); padding:40px 0; font-size:15px}
  footer{margin-top:34px; text-align:center; color:var(--muted); font-size:13px; line-height:1.9}
</style>
</head>
<body>
<header class="top">
  <div class="inner">
    <h1>${esc(SITE_TITLE)}</h1>
    <p>${esc(SITE_SUB)}</p>
  </div>
</header>

<div class="wrap">
  <div class="tools">
    <input id="q" type="search" placeholder="搜索标题…" autocomplete="off" enterkeyhint="search">
    <div class="chips">${filters}</div>
  </div>

  <div class="grid" id="grid">
${cards}
  </div>
  <p class="empty" id="empty">没有匹配的教辅</p>

  <footer>
    共 ${items.length} 份教辅　·　更新于 ${fmt(new Date())}<br>
    用 Safari 打开本页面，公式和按钮都能正常使用
  </footer>
</div>

<script>
(function(){
  var q = document.getElementById('q');
  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var subject = '全部';

  function apply(){
    var kw = q.value.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function(c){
      var okSub = subject === '全部' || c.dataset.subject === subject;
      var okKw  = !kw || c.dataset.search.indexOf(kw) !== -1;
      var ok = okSub && okKw;
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    empty.style.display = shown ? 'none' : 'block';
  }

  q.addEventListener('input', apply);
  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chips.forEach(function(c){ c.classList.remove('on'); });
      chip.classList.add('on');
      subject = chip.dataset.filter;
      apply();
    });
  });
})();
</script>
</body>
</html>
`;

writeFileSync(join(ROOT, 'index.html'), page, 'utf8');
console.log(`已生成 index.html —— ${items.length} 份教辅：`);
for (const i of items) console.log(`  [${i.subject}] ${i.title}`);
