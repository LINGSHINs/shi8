/* ============ 拾志 · 核心逻辑 ============ */
'use strict';

/* ---------- 主题元数据 ---------- */
var THEMES = [
  { id: 'shizhi', name: '拾志 · 默认', desc: '清爽蓝白，专注刷题', fx: 'none', shape: '', c: ['#f2f5fb', '#ffffff', '#3b6fe0'] },
  { id: 'night', name: '暗夜模式', desc: '纯黑暗色，夜间护眼', fx: 'none', shape: '', c: ['#0e131b', '#1a212e', '#5b8cff'] },
  { id: 'gba', name: '宝可梦 · 点阵屏', desc: 'GBA 掌机绿屏扫描线', fx: 'scan', shape: 'pixel', c: ['#4a3f6b', '#a8c64e', '#2e5a17'] },
  { id: 'cyber', name: '赛博朋克 · 霓虹', desc: '霓虹光污染夜之城', fx: 'scan', shape: '', c: ['#070b16', '#0e1630', '#00e5ff'] },
  { id: 'farm', name: '星露谷 · 像素农场', desc: '暖棕木纹像素风', fx: 'none', shape: 'pixel', c: ['#6d4423', '#f7d9a2', '#c85a28'] },
  { id: 'shinkai', name: '新海诚 · 云海', desc: '天空渐变漫画空气感', fx: 'none', shape: '', c: ['#a9d7f5', '#ffffff', '#3f8fd6'] },
  { id: 'fc', name: 'FC · 红白机', desc: '经典红白像素配色', fx: 'none', shape: 'pixel', c: ['#e9e7dd', '#ffffff', '#d9402c'] },
  { id: 'vapor', name: '蒸汽波 · 落日', desc: '紫粉渐变复古未来', fx: 'grid', shape: '', c: ['#2b1a5e', '#241034', '#ff71ce'] },
  { id: 'terminal', name: '终端 · 荧光绿', desc: '黑底绿字极客风', fx: 'scan', shape: '', c: ['#04080a', '#0a1410', '#37ff8b'] },
  { id: 'paper', name: '纸间笔记', desc: '米黄横线笔记本', fx: 'lines', shape: '', c: ['#f6f1e3', '#fffdf4', '#33518a'] },
  { id: 'ink', name: '水墨丹青', desc: '宣纸墨色印章红', fx: 'none', shape: '', c: ['#f2efe6', '#faf8f0', '#3a3a3c'] },
  { id: 'morandi', name: '莫兰迪 · 灰调', desc: '低饱和高级灰', fx: 'none', shape: '', c: ['#e9e6e1', '#f6f4f0', '#8fa3b0'] },
  { id: 'eye', name: '护眼 · 豆绿', desc: '经典护眼绿底', fx: 'none', shape: '', c: ['#cfe3cd', '#f0f7ec', '#2e7d4f'] },
  { id: 'ocean', name: '深海 · 潜蓝', desc: '深蓝静谧暗色', fx: 'none', shape: '', c: ['#0a2138', '#11314f', '#38bdf8'] },
  { id: 'sunset', name: '落日 · 橙光', desc: '暖橙治愈浅色系', fx: 'none', shape: '', c: ['#fdf3e7', '#fffaf3', '#f4711f'] },
  { id: 'sakura', name: '樱花 · 初粉', desc: '淡粉温柔少女系', fx: 'none', shape: '', c: ['#fdeef3', '#fff8fa', '#e05a7a'] },
  { id: 'lavender', name: '薰衣草 · 雾紫', desc: '浅紫安静柔和', fx: 'none', shape: '', c: ['#f0edfa', '#faf9ff', '#7c6bd6'] },
  { id: 'latte', name: '咖啡 · 拿铁', desc: '暖棕咖啡馆氛围', fx: 'none', shape: '', c: ['#efe5d8', '#fbf6ec', '#a9744f'] },
  { id: 'galaxy', name: '星空 · 夜航', desc: '深紫星空微光', fx: 'stars', shape: '', c: ['#120f2e', '#1c1846', '#8f7bff'] },
  { id: 'contrast', name: '高对比 · 无障碍', desc: '黑白高对比清晰易读', fx: 'none', shape: '', c: ['#000000', '#101010', '#ffd60a'] },
  { id: 'amber', name: '琥珀 · 旧屏', desc: '琥珀色复古显示器', fx: 'scan', shape: '', c: ['#241a06', '#33250c', '#ffb020'] },
  { id: 'mint', name: '薄荷 · 清糖', desc: '薄荷绿清爽白', fx: 'none', shape: '', c: ['#e7f7f1', '#ffffff', '#12a377'] },
  { id: 'comic', name: '漫画 · 网点', desc: '粗描边网点漫画风', fx: 'dots', shape: 'comic', c: ['#fdfbf2', '#ffffff', '#2456d6'] },
  { id: 'gold', name: '鎏金 · 荣耀', desc: '金黑成就殿堂', fx: 'none', shape: '', c: ['#14100a', '#211a0f', '#d4a437'] }
];

/* ---------- 常量 ---------- */
var IV = [5 * 60e3, 30 * 60e3, 12 * 36e5, 864e5, 2 * 864e5, 4 * 864e5, 7 * 864e5, 15 * 864e5];
var LVL_NAMES = ['初识', '入门', '熟悉', '巩固', '牢记', '精通', '深刻', '长时记忆'];
var TYPE_NAMES = ['判断题', '单选题', '多选题'];
var TYPE_SHORT = ['判断', '单选', '多选'];
var LETTERS = 'ABCDEF';
var KEY = 'shizhi_v1';

/* ---------- 存储 ---------- */
function defaults() {
  return {
    skin: 'shizhi', goal: 30, autoNext: true,
    xp: 0, created: Date.now(),
    seq: {}, pq: {}, daily: {}, ach: {},
    best: { lightning: 0, life: 0, boss: 0 },
    stats: { ans: 0, ok: 0 },
    lastDay: '', streak: 0, wbKilled: 0
  };
}
var ST;
function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { ST = Object.assign(defaults(), JSON.parse(raw)); return; }
  } catch (e) { }
  ST = defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
function sample(a, n) { return shuffle(a).slice(0, n); }
function dateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}
function todayStr() { return dateStr(new Date()); }
function fmtSec(s) {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60), ss = s % 60;
  return String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}
function fmtTs(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function fmtDue(ts) {
  const diff = ts - Date.now();
  if (diff <= 0) return '已到期';
  const m = Math.ceil(diff / 60e3);
  if (m < 60) return m + ' 分钟后';
  const h = Math.ceil(m / 60);
  if (h < 24) return h + ' 小时后';
  return Math.ceil(h / 24) + ' 天后';
}

/* ---------- 题库辅助 ---------- */
const QS = QB.qs;
function qDept(id) { return QS[id][0]; }
function qType(id) { return QS[id][1]; }
function qText(id) { return QS[id][2]; }
function qOpts(id) { return QS[id][3]; }
function qAns(id) { return QS[id][4]; }
function ansText(id) {
  const t = qType(id), a = qAns(id), o = qOpts(id);
  if (t === 0) return a[0] === 0 ? '正确' : '错误';
  return a.map(i => LETTERS[i] + '. ' + o[i]).join('\n');
}
function ansLetters(id) { return qAns(id).map(i => LETTERS[i]).join(''); }
function allIds() { return QS.map((_, i) => i); }
function idsOfDept(d) { return allIds().filter(i => qDept(i) === d); }
function idsOfType(t) { return allIds().filter(i => qType(i) === t); }

/* ---------- 题目级统计 ---------- */
function pq(id) { return ST.pq[id] || null; }
function ensurePQ(id) {
  if (!ST.pq[id]) ST.pq[id] = { c: 0, w: 0, lvl: -1, next: 0, last: 0, wb: 0, wbOk: 0 };
  return ST.pq[id];
}
function isMastered(p) {
  if (!p) return false;
  if (p.lvl >= 7) return true;
  const n = p.c + p.w;
  return n >= 5 && p.c / n >= 0.8;
}
function masteredCount() {
  let n = 0;
  for (const k in ST.pq) if (isMastered(ST.pq[k])) n++;
  return n;
}
function seenCount() { return Object.keys(ST.pq).length; }
function unseenIds() { return allIds().filter(i => !ST.pq[i]); }
function dueIds() {
  const now = Date.now(), out = [];
  for (const k in ST.pq) {
    const p = ST.pq[k];
    if (p.next && p.next <= now && !isMastered(p)) out.push(+k);
  }
  return out.sort((a, b) => ST.pq[a].next - ST.pq[b].next);
}
function upcomingIds(limit) {
  const now = Date.now(), out = [];
  for (const k in ST.pq) {
    const p = ST.pq[k];
    if (p.next && p.next > now && !isMastered(p)) out.push(+k);
  }
  return out.sort((a, b) => ST.pq[a].next - ST.pq[b].next).slice(0, limit || 10);
}
function wrongIds() {
  const out = [];
  for (const k in ST.pq) if (ST.pq[k].wb) out.push(+k);
  return out.sort((a, b) => (ST.pq[b].w - ST.pq[b].c) - (ST.pq[a].w - ST.pq[a].c));
}
function hardestIds(n) {
  return allIds()
    .map(i => ({ i, p: ST.pq[i] }))
    .filter(x => x.p && x.p.c + x.p.w >= 1)
    .sort((a, b) => (b.p.w / (b.p.c + b.p.w)) - (a.p.w / (a.p.c + a.p.w)) || (b.p.w - a.p.w))
    .slice(0, n).map(x => x.i);
}
function deptTouched() {
  const s = new Set();
  for (const k in ST.pq) s.add(qDept(+k));
  return s.size;
}

/* ---------- 等级 / 每日 / 连续 ---------- */
function levelInfo() {
  const lv = Math.floor(Math.sqrt(ST.xp / 60)) + 1;
  const base = 60 * (lv - 1) * (lv - 1), next = 60 * lv * lv;
  return { lv, cur: ST.xp - base, need: next - base, xp: ST.xp };
}
function touchDaily(ok) {
  const t = todayStr();
  if (ST.lastDay !== t) {
    const y = dateStr(new Date(Date.now() - 864e5));
    ST.streak = (ST.lastDay === y) ? ST.streak + 1 : 1;
    ST.lastDay = t;
  }
  if (!ST.daily[t]) ST.daily[t] = { a: 0, o: 0 };
  ST.daily[t].a++; if (ok) ST.daily[t].o++;
}
function todayData() { return ST.daily[todayStr()] || { a: 0, o: 0 }; }

/* ---------- 答题记录 ---------- */
var LAST_OK = false;
function recordAnswer(qid, ok, mode) {
  const p = ensurePQ(qid);
  if (ok) { p.c++; } else { p.w++; }
  p.last = Date.now();
  if (ok) {
    p.lvl = Math.min(7, (p.lvl < 0 ? 0 : p.lvl + 1));
    p.next = Date.now() + IV[p.lvl];
    if (p.wb) {
      p.wbOk = (p.wbOk || 0) + 1;
      if (p.wbOk >= 2) { p.wb = 0; p.wbOk = 0; ST.wbKilled++; }
    }
  } else {
    p.lvl = 0;
    p.next = Date.now() + IV[0];
    if (mode !== 'flash' && mode !== 'memorize') { p.wb = 1; p.wbOk = 0; }
  }
  ST.stats.ans++; if (ok) ST.stats.ok++;
  ST.xp += ok ? 3 : 1;
  touchDaily(ok);
  LAST_OK = ok;
  checkAchs();
  save();
}

/* ---------- 成就 ---------- */
var ACHS = [
  { id: 'first', n: '初出茅庐', d: '回答第一道题', f: () => ST.stats.ans >= 1 },
  { id: 'a100', n: '百题斩', d: '累计答题 100 道', f: () => ST.stats.ans >= 100 },
  { id: 'a500', n: '五百强', d: '累计答题 500 道', f: () => ST.stats.ans >= 500 },
  { id: 'a1000', n: '千锤百炼', d: '累计答题 1000 道', f: () => ST.stats.ans >= 1000 },
  { id: 'all', n: '题库通关', d: '累计答题 ' + QB.meta.total + ' 道', f: () => ST.stats.ans >= QB.meta.total },
  { id: 'acc80', n: '神射手', d: '正确率 80%+（至少答 100 题）', f: () => ST.stats.ans >= 100 && ST.stats.ok / ST.stats.ans >= 0.8 },
  { id: 'streak7', n: '七日之约', d: '连续打卡 7 天', f: () => ST.streak >= 7 },
  { id: 'streak30', n: '月度修行', d: '连续打卡 30 天', f: () => ST.streak >= 30 },
  { id: 'mem50', n: '记忆大师', d: '50 道题进入长期记忆（4 级以上）', f: () => memCount(4) >= 50 },
  { id: 'master100', n: '融会贯通', d: '完全掌握 100 道题', f: () => masteredCount() >= 100 },
  { id: 'wb50', n: '错题猎人', d: '从错题本消灭 50 道题', f: () => ST.wbKilled >= 50 },
  { id: 'boss', n: '斩将', d: '赢下一场 BOSS 战', f: () => ST.best.boss >= 1 },
  { id: 'light150', n: '闪电侠', d: '闪电挑战得分 150 以上', f: () => ST.best.lightning >= 150 },
  { id: 'life20', n: '不死鸟', d: '生命模式连对 20 题', f: () => ST.best.life >= 20 },
  { id: 'alldept', n: '八方来仪', d: '每个部门都至少答过 1 题', f: () => deptTouched() >= QB.meta.depts.length },
  { id: 'night', n: '夜行者', d: '在 23 点之后答对一题', f: () => LAST_OK && new Date().getHours() >= 23 }
];
function memCount(minLvl) {
  let n = 0;
  for (const k in ST.pq) if ((ST.pq[k].lvl || 0) >= minLvl) n++;
  return n;
}
function checkAchs() {
  for (const a of ACHS) {
    if (!ST.ach[a.id] && a.f()) {
      ST.ach[a.id] = Date.now();
      toast('成就达成 · ' + a.n);
    }
  }
}

/* ---------- 主题 ---------- */
function applyTheme(id) {
  const t = THEMES.find(x => x.id === id) || THEMES[0];
  document.body.dataset.theme = t.id;
  document.body.dataset.fx = t.fx || 'none';
  if (t.shape) document.body.dataset.shape = t.shape;
  else delete document.body.dataset.shape;
  ST.skin = t.id; save();
}

/* ---------- 提示 / 弹窗 ---------- */
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
function showModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-mask').classList.remove('hide');
}
function closeModal() { document.getElementById('modal-mask').classList.add('hide'); }
document.addEventListener('click', e => {
  if (e.target.id === 'modal-mask') closeModal();
});

/* ---------- 导出 / 导入 ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(ST)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '拾志学习数据_' + todayStr() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function importData(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || typeof d !== 'object' || !d.stats) throw 0;
      ST = Object.assign(defaults(), d);
      save(); applyTheme(ST.skin);
      toast('数据导入成功');
      go('home');
    } catch (e) { toast('文件格式不正确'); }
  };
  rd.readAsText(file);
}
