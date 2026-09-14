/* ============ 拾志 · 视图层 ============ */
'use strict';

var TITLES = {
  home: '拾志', seq: '顺序刷题', dept: '部门专项', exam: '组卷考试',
  review: '遗忘曲线', flash: '闪卡记忆', memorize: '背题模式',
  stats: '学习数据', wrong: '错题本', skins: '皮肤中心', settings: '设置',
  session: '刷题中', result: '练习结果'
};
var ROUTES = {};
var curRoute = 'home', PARAMS = {}, prevStack = [];

function go(route, params) {
  stopAllTimers();
  if (route === 'home') prevStack = [];
  else if (route === 'result') prevStack = prevStack.filter(r => r !== 'session');
  else if (route !== curRoute) prevStack.push(curRoute);
  curRoute = route; PARAMS = params || {};
  render();
  window.scrollTo(0, 0);
}
function goBack() {
  stopAllTimers();
  curRoute = prevStack.pop() || 'home';
  render();
  window.scrollTo(0, 0);
}
function render() {
  const v = document.getElementById('view');
  v.innerHTML = '';
  document.getElementById('topbar-right').innerHTML = '';
  (ROUTES[curRoute] || ROUTES.home)(v);
  const back = document.getElementById('btn-back');
  back.classList.toggle('hide', curRoute === 'home');
  document.getElementById('topbar-title').textContent = TITLES[curRoute] || '拾志';
}

/* ---------- 公共小组件 ---------- */
function ringSVG(pct, size, stroke) {
  size = size || 92; stroke = stroke || 9;
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  const off = C * (1 - Math.max(0, Math.min(1, pct)));
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--card2)" stroke-width="' + stroke + '"/>' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--ac)" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>';
}
function donutSVG(parts, size, stroke) {
  size = size || 150; stroke = stroke || 24;
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  let acc = 0, segs = '';
  const total = parts.reduce((s, p) => s + p.v, 0);
  if (total <= 0) return '<svg width="' + size + '" height="' + size + '"></svg>';
  parts.forEach(p => {
    if (p.v <= 0) return;
    const len = C * p.v / total;
    segs += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + p.color + '" stroke-width="' + stroke + '" stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" stroke-dashoffset="' + (-acc).toFixed(1) + '"/>';
    acc += len;
  });
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="transform:rotate(-90deg)">' + segs + '</svg>';
}
function scopeOptions(sel, extra) {
  let h = '<option value="all"' + (sel === 'all' ? ' selected' : '') + '>全部题库（' + QB.meta.total + ' 题）</option>';
  QB.meta.depts.forEach((d, i) => {
    h += '<option value="d' + i + '"' + (sel === 'd' + i ? ' selected' : '') + '>' + d.name + '（' + d.count + ' 题）</option>';
  });
  if (extra) h += extra;
  return h;
}
function poolOf(scope) {
  if (scope === 'all') return allIds();
  if (scope === 'wrong') return wrongIds();
  if (scope === 'due') return dueIds();
  if (scope && scope[0] === 'd') return idsOfDept(+scope.slice(1));
  return allIds();
}
function smartPool(scope, n) {
  if (scope === 'wrong' || scope === 'due') return poolOf(scope).slice(0, n);
  const due = dueIds(), unseen = unseenIds();
  const base = poolOf(scope);
  const inScope = new Set(base);
  const pick = due.filter(i => inScope.has(i)).concat(unseen.filter(i => inScope.has(i)));
  const rest = base.filter(i => pick.indexOf(i) < 0);
  return pick.concat(shuffle(rest)).slice(0, n);
}
function previewTxt(s, n) { s = String(s); return s.length > n ? s.slice(0, n) + '…' : s; }

/* ---------- 首页 ---------- */
ROUTES.home = function (v) {
  const td = todayData(), lv = levelInfo();
  const due = dueIds().length, wb = wrongIds().length, mast = masteredCount();
  const acc = ST.stats.ans ? Math.round(ST.stats.ok / ST.stats.ans * 100) : 0;
  const goalPct = ST.goal ? td.a / ST.goal : 0;
  const modes = [
    { r: 'seq', ico: '序', n: '顺序刷题', d: '按题库顺序逐个攻克', badge: '' },
    { r: 'exam', ico: '卷', n: '组卷考试', d: '限时模拟卷，检验成果', badge: '' },
    { r: 'dept', ico: '部', n: '部门专项', d: QB.meta.depts.length + ' 大部门分类突破', badge: '' },
    { r: 'review', ico: '忆', n: '遗忘曲线', d: '科学间隔，定时复习', badge: due ? due + ' 待复习' : '' },
    { r: 'memorize', ico: '背', n: '背题模式', d: '先看答案再记，背诵专用', badge: '' },
    { r: 'flash', ico: '卡', n: '闪卡记忆', d: '翻卡自测，三档评分', badge: '' },
    { r: 'lightning', ico: '电', n: '闪电挑战', d: '每题 10 秒，极速抢分', badge: ST.best.lightning ? '最高 ' + ST.best.lightning : '' },
    { r: 'life', ico: '命', n: '生命模式', d: '3 条命，错一题掉一命', badge: ST.best.life ? '连对 ' + ST.best.life : '' },
    { r: 'boss', ico: 'BOSS', n: 'BOSS 战', d: '挑战你的高错率题', badge: ST.best.boss ? '胜 ' + ST.best.boss + ' 场' : '' },
    { r: 'wrong', ico: '错', n: '错题本', d: '答错自动收录', badge: wb ? wb + ' 题' : '' },
    { r: 'stats', ico: '图', n: '学习数据', d: '进度可视化与成就', badge: '' },
    { r: 'skins', ico: '肤', n: '皮肤中心', d: THEMES.length + ' 款主题随心换', badge: '' }
  ];
  let mh = '';
  modes.forEach(m => {
    mh += '<button class="mode-card" data-r="' + m.r + '">' +
      (m.badge ? '<span class="mode-badge' + (m.badge.indexOf('最高') === 0 || m.badge.indexOf('连对') === 0 || m.badge.indexOf('胜') === 0 ? ' ac' : '') + '">' + esc(m.badge) + '</span>' : '') +
      '<span class="mode-ico">' + m.ico + '</span><b>' + m.n + '</b><span>' + m.d + '</span></button>';
  });
  v.innerHTML =
    '<div class="hero">' +
    '<div class="hero-logo">拾</div>' +
    '<div style="flex:1">' +
    '<div class="row spread"><div class="hero-name">拾志</div><span class="chip">Lv.' + lv.lv + '</span></div>' +
    '<div class="hero-sub">运营岗位资质题库 · 共 ' + QB.meta.total + ' 题</div>' +
    '<div class="lv-bar"><i style="width:' + Math.min(100, Math.round(lv.cur / lv.need * 100)) + '%"></i></div>' +
    '</div></div>' +
    '<div class="card today-card">' +
    '<div class="ring-wrap">' + ringSVG(goalPct) + '<div class="ring-txt"><b>' + td.a + '</b><span>/ ' + ST.goal + ' 目标</span></div></div>' +
    '<div class="today-nums">' +
    '<div class="tnum"><b>' + (td.a ? Math.round(td.o / td.a * 100) + '%' : '--') + '</b><span>今日正确率</span></div>' +
    '<div class="tnum"><b>' + ST.streak + ' 天</b><span>连续打卡</span></div>' +
    '<div class="tnum"><b>' + due + '</b><span>待复习</span></div>' +
    '<div class="tnum"><b>' + mast + '</b><span>已掌握</span></div>' +
    '</div></div>' +
    '<div class="mode-grid">' + mh + '</div>' +
    '<div class="card tight mt16 center sub">累计答题 ' + ST.stats.ans + ' · 累计正确率 ' + acc + '% · 掌握 ' + mast + '/' + QB.meta.total + '</div>';
  v.querySelectorAll('.mode-card').forEach(b => {
    b.onclick = () => {
      const r = b.dataset.r;
      if (r === 'lightning') startLightning();
      else if (r === 'life') startLife();
      else if (r === 'boss') startBoss();
      else go(r);
    };
  });
  document.getElementById('topbar-right').innerHTML =
    '<button class="icon-btn" id="tb-skin" title="皮肤">肤</button>' +
    '<button class="icon-btn" id="tb-set" title="设置">设</button>';
  document.getElementById('tb-skin').onclick = () => go('skins');
  document.getElementById('tb-set').onclick = () => go('settings');
};

/* ---------- 顺序刷题 ---------- */
ROUTES.seq = function (v) {
  const sel = PARAMS.scope || 'all';
  const ptr = ST.seq[sel] || 0;
  const total = poolOf(sel).length;
  v.innerHTML =
    '<div class="card"><h3>选择范围</h3>' +
    '<select id="seq-scope" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd);background:var(--card2);color:var(--tx);font-size:15px">' +
    scopeOptions(sel) + '</select>' +
    '<div class="faint mt8">当前进度：第 ' + Math.min(ptr + 1, total) + ' / ' + total + ' 题</div></div>' +
    '<div class="btn-row mt12">' +
    (ptr > 0 && ptr < total ? '<button class="btn" id="seq-cont">继续上次（第 ' + (ptr + 1) + ' 题）</button>' : '') +
    '<button class="btn ghost" id="seq-re">从头开始</button>' +
    '</div>' +
    '<div class="btn-row mt12"><button class="btn ghost" id="seq-rand">随机抽 20 题</button></div>' +
    '<div class="card mt16 sub">顺序刷题会自动记住每个范围的进度，随时回来继续。答题正确率与遗忘曲线复习计划会同步累计。</div>';
  const scopeEl = v.querySelector('#seq-scope');
  scopeEl.onchange = () => go('seq', { scope: scopeEl.value });
  const cont = v.querySelector('#seq-cont');
  if (cont) cont.onclick = () => startSeq(sel, ptr);
  v.querySelector('#seq-re').onclick = () => { ST.seq[sel] = 0; save(); startSeq(sel, 0); };
  v.querySelector('#seq-rand').onclick = () => againRand(sel, 20);
};
function startSeq(scope, from) {
  const ids = poolOf(scope);
  if (!from || from >= ids.length) from = 0;
  startQuiz({
    mode: 'seq', label: '顺序刷题', ids: ids, from: from, scope: scope,
    again: () => startSeq(scope, (ST.seq[scope] || 0) >= ids.length ? 0 : (ST.seq[scope] || 0))
  });
}

/* ---------- 部门专项 ---------- */
ROUTES.dept = function (v) {
  let h = '<div class="card tight sub">选择一个部门开始专项训练，进度与正确率实时统计。</div>';
  QB.meta.depts.forEach((d, i) => {
    const ids = idsOfDept(i);
    let seen = 0, c = 0, w = 0;
    ids.forEach(id => { const p = pq(id); if (p) { seen++; c += p.c; w += p.w; } });
    const acc = c + w ? Math.round(c / (c + w) * 100) : null;
    h += '<div class="list-item" data-d="' + i + '">' +
      '<div class="li-main"><div class="li-title">' + d.name + '</div>' +
      '<div class="li-sub">' + d.count + ' 题 · 已练 ' + seen + ' 题' + (acc !== null ? ' · 正确率 ' + acc + '%' : '') + '</div>' +
      '<div class="pbar mt8"><i style="width:' + Math.round(seen / d.count * 100) + '%"></i></div></div>' +
      '<span class="chip">' + Math.round(seen / d.count * 100) + '%</span></div>';
  });
  v.innerHTML = h;
  v.querySelectorAll('.list-item').forEach(el => {
    el.onclick = () => {
      const di = +el.dataset.d, name = QB.meta.depts[di].name;
      const ptr = ST.seq['d' + di] || 0, total = QB.meta.depts[di].count;
      const wbN = wrongIds().filter(id => qDept(id) === di).length;
      showModal('<h3>' + name + '</h3>' +
        '<div class="btn-row" style="flex-direction:column">' +
        '<button class="btn" data-a="rand">随机练 20 题</button>' +
        (ptr > 0 && ptr < total ? '<button class="btn ghost" data-a="cont">继续顺序（第 ' + (ptr + 1) + ' 题）</button>' : '') +
        '<button class="btn ghost" data-a="seq">顺序从头开始</button>' +
        (wbN ? '<button class="btn danger" data-a="wb">只练本部门错题（' + wbN + '）</button>' : '') +
        '</div>');
      document.querySelectorAll('#modal-box [data-a]').forEach(b => {
        b.onclick = () => {
          closeModal();
          const a = b.dataset.a;
          if (a === 'rand') againRand('d' + di, 20, name + ' · 随机');
          else if (a === 'cont') startSeq('d' + di, ptr);
          else if (a === 'seq') { ST.seq['d' + di] = 0; save(); startSeq('d' + di, 0); }
          else if (a === 'wb') againWrong(wrongIds().filter(id => qDept(id) === di), name + ' · 错题');
        };
      });
    };
  });
};

/* ---------- 组卷考试 ---------- */
ROUTES.exam = function (v) {
  const n = PARAMS.n || 50, scope = PARAMS.scope || 'all';
  v.innerHTML =
    '<div class="card"><h3>试卷配置</h3>' +
    '<div class="set-row"><div class="sr-l"><b>题目数量</b></div>' +
    '<select id="ex-n">' + [20, 50, 100].map(x => '<option value="' + x + '"' + (x === n ? ' selected' : '') + '>' + x + ' 题</option>').join('') + '</select></div>' +
    '<div class="set-row"><div class="sr-l"><b>出题范围</b></div>' +
    '<select id="ex-scope">' + scopeOptions(scope) + '</select></div>' +
    '<div class="set-row"><div class="sr-l"><b>考试时长</b><span>按每题 40 秒自动计算</span></div><b id="ex-time"></b></div>' +
    '</div>' +
    '<button class="btn block big" id="ex-go">开始考试</button>' +
    '<div class="card mt16 sub">交卷后按正确率评分，90 分以上为优秀。超时将自动交卷，未答题目不计分。</div>';
  const nEl = v.querySelector('#ex-n'), sEl = v.querySelector('#ex-scope'), tEl = v.querySelector('#ex-time');
  const upd = () => { tEl.textContent = Math.round(+nEl.value * 40 / 60) + ' 分钟'; };
  nEl.onchange = upd; upd();
  v.querySelector('#ex-go').onclick = () => {
    const cnt = +nEl.value, sc = sEl.value;
    const pool = poolOf(sc);
    if (pool.length < cnt) { toast('该范围只有 ' + pool.length + ' 题'); return; }
    const mk = () => startQuiz({ mode: 'exam', label: '组卷考试', ids: sample(pool, cnt), timeLimit: cnt * 40, again: mk });
    mk();
  };
};

/* ---------- 遗忘曲线 ---------- */
ROUTES.review = function (v) {
  const due = dueIds(), upcoming = upcomingIds(8), mast = masteredCount();
  const lvlCnt = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const k in ST.pq) { const l = ST.pq[k].lvl; if (l >= 0) lvlCnt[l]++; }
  let bars = '';
  const maxC = Math.max(1, ...lvlCnt);
  lvlCnt.forEach((c, i) => {
    bars += '<div class="bar-row"><span class="bl">' + LVL_NAMES[i] + '</span>' +
      '<span class="bt"><i style="width:' + Math.round(c / maxC * 100) + '%"></i></span>' +
      '<span class="bv">' + c + '</span></div>';
  });
  let up = '';
  if (upcoming.length) {
    up = '<div class="card"><h3>即将到期</h3>' + upcoming.map(i => {
      const p = pq(i);
      return '<div class="row spread" style="padding:6px 0;border-bottom:1px solid var(--bd)">' +
        '<span class="sub" style="flex:1">' + esc(previewTxt(qText(i), 24)) + '</span>' +
        '<span class="chip">' + fmtDue(p.next) + '</span></div>';
    }).join('') + '</div>';
  }
  v.innerHTML =
    '<div class="card center" style="padding:22px">' +
    '<div style="font-size:40px;font-weight:800">' + due.length + '</div>' +
    '<div class="sub">道题已到复习时间</div>' +
    '<div class="btn-row mt16" style="max-width:340px;margin:16px auto 0">' +
    '<button class="btn big" id="rv-go"' + (due.length ? '' : ' disabled') + '>开始复习' + (due.length ? '（' + Math.min(due.length, 50) + ' 题）' : '') + '</button></div>' +
    '<div class="btn-row" style="max-width:340px;margin:0 auto"><button class="btn ghost" id="rv-new">学习 20 道新题</button></div>' +
    '</div>' +
    '<div class="card"><h3>记忆等级分布</h3>' + bars +
    '<div class="faint mt8">复习间隔：5 分钟 → 30 分钟 → 12 小时 → 1 天 → 2 天 → 4 天 → 7 天 → 15 天。答对升级并延长间隔，答错回到起点。达到「长时记忆」或高正确率即视为掌握。</div></div>' +
    up;
  v.querySelector('#rv-go').onclick = () => startQuiz({ mode: 'review', label: '遗忘曲线复习', ids: due.slice(0, 50), again: againReview });
  v.querySelector('#rv-new').onclick = () => {
    const un = sample(unseenIds(), 20);
    if (!un.length) { toast('题库已全部学过'); return; }
    startQuiz({ mode: 'review', label: '学习新题', ids: un, again: againReview });
  };
};

/* ---------- 闪卡记忆 ---------- */
ROUTES.flash = function (v) {
  const scope = PARAMS.scope || 'due', n = PARAMS.n || 20;
  const dueN = dueIds().length, wbN = wrongIds().length;
  v.innerHTML =
    '<div class="card"><h3>闪卡设置</h3>' +
    '<div class="set-row"><div class="sr-l"><b>卡片来源</b></div>' +
    '<select id="fl-scope">' +
    '<option value="due"' + (scope === 'due' ? ' selected' : '') + '>到期待复习（' + dueN + '）</option>' +
    '<option value="all"' + (scope === 'all' ? ' selected' : '') + '>全部题库</option>' +
    scopeOptions('').replace('<option value="all"', '<option value="all" style="display:none"') +
    '<option value="wrong"' + (scope === 'wrong' ? ' selected' : '') + '>错题本（' + wbN + '）</option>' +
    '</select></div>' +
    '<div class="set-row"><div class="sr-l"><b>卡片数量</b></div>' +
    '<select id="fl-n">' + [10, 20, 30, 50].map(x => '<option value="' + x + '"' + (x === n ? ' selected' : '') + '>' + x + ' 张</option>').join('') + '</select></div>' +
    '</div>' +
    '<button class="btn block big" id="fl-go">开始翻卡</button>' +
    '<div class="card mt16 sub">看到题目先回忆答案，再点卡片翻面。按「忘了 / 模糊 / 记住了」三档评分，评分会写入遗忘曲线复习计划。</div>';
  fixScopeSelect(v.querySelector('#fl-scope'), scope);
  v.querySelector('#fl-go').onclick = () => {
    const sc = v.querySelector('#fl-scope').value, cnt = +v.querySelector('#fl-n').value;
    const ids = smartPool(sc, cnt);
    if (!ids.length) { toast('该来源暂时没有卡片'); return; }
    startFlash(ids);
  };
};

/* ---------- 背题模式 ---------- */
ROUTES.memorize = function (v) {
  const scope = PARAMS.scope || 'all', n = PARAMS.n || 30;
  v.innerHTML =
    '<div class="card"><h3>背题设置</h3>' +
    '<div class="set-row"><div class="sr-l"><b>背诵范围</b></div>' +
    '<select id="mm-scope">' + scopeOptions(scope) + '</select></div>' +
    '<div class="set-row"><div class="sr-l"><b>背诵数量</b></div>' +
    '<select id="mm-n">' + [20, 30, 50, 100].map(x => '<option value="' + x + '"' + (x === n ? ' selected' : '') + '>' + x + ' 题</option>').join('') + '</select></div>' +
    '</div>' +
    '<div class="btn-row"><button class="btn" id="mm-go">开始背诵</button><button class="btn ghost" id="mm-hard">只背高频错题</button></div>' +
    '<div class="card mt16 sub">背题模式不做测验：先读题，点开答案对照记忆，标记「记住了 / 还没记住」，系统会循环安排直到你全部标记记住。适合考前快速过一遍。</div>';
  v.querySelector('#mm-go').onclick = () => {
    const sc = v.querySelector('#mm-scope').value, cnt = +v.querySelector('#mm-n').value;
    startMemorize(smartPool(sc, cnt));
  };
  v.querySelector('#mm-hard').onclick = () => {
    const ids = hardestIds(30);
    if (!ids.length) { toast('还没有答题记录'); return; }
    startMemorize(ids);
  };
};
function fixScopeSelect(sel, cur) {
  const opts = sel.querySelectorAll('option');
  const seen = new Set();
  opts.forEach(o => {
    if (seen.has(o.value)) o.remove(); else seen.add(o.value);
  });
  if (cur && sel.querySelector('option[value="' + cur + '"]')) sel.value = cur;
}

/* ---------- 学习数据 ---------- */
ROUTES.stats = function (v) {
  const total = QB.meta.total, ans = ST.stats.ans;
  const acc = ans ? Math.round(ST.stats.ok / ans * 100) : 0;
  const mast = masteredCount(), seen = seenCount();
  let weak = 0, learning = 0;
  for (const k in ST.pq) {
    const p = ST.pq[k];
    if (isMastered(p)) continue;
    if (p.w > p.c) weak++; else learning++;
  }
  const unseen = total - seen;
  const td = todayData();
  let h = '<div class="kpi-grid">' +
    '<div class="kpi"><b>' + ans + '</b><span>累计答题</span></div>' +
    '<div class="kpi"><b>' + acc + '%</b><span>累计正确率</span></div>' +
    '<div class="kpi"><b>' + mast + ' / ' + total + '</b><span>已掌握</span></div>' +
    '<div class="kpi"><b>' + ST.streak + ' 天</b><span>连续打卡</span></div>' +
    '</div>';
  h += '<div class="card"><h3>掌握度分布</h3><div class="row" style="gap:18px">' +
    donutSVG([
      { v: mast, color: 'var(--ok)' }, { v: learning, color: 'var(--ac)' },
      { v: weak, color: 'var(--err)' }, { v: unseen, color: 'var(--card2)' }
    ], 140, 22) +
    '<div style="font-size:13px;line-height:2">' +
    '<div><span class="chip ok">掌握</span> ' + mast + ' 题</div>' +
    '<div><span class="chip ac">学习中</span> ' + learning + ' 题</div>' +
    '<div><span class="chip err">薄弱</span> ' + weak + ' 题</div>' +
    '<div><span class="chip">未学</span> ' + unseen + ' 题</div>' +
    '</div></div></div>';
  h += '<div class="card"><h3>近 14 天正确率</h3>' + lineChartHTML() + '</div>';
  h += '<div class="card"><h3>近 12 周练习热力</h3>' + heatmapHTML() + '</div>';
  h += '<div class="card"><h3>部门正确率</h3>' + deptBarsHTML() + '</div>';
  h += '<div class="card"><h3>题型正确率</h3>' + typeChipsHTML() + '</div>';
  h += hardestHTML();
  h += achHTML();
  v.innerHTML = h;
  v.querySelectorAll('[data-qid]').forEach(el => {
    el.onclick = () => showQModal(+el.dataset.qid);
  });
};
function lineChartHTML() {
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(dateStr(new Date(Date.now() - i * 864e5)));
  const vals = days.map(d => ST.daily[d] && ST.daily[d].a ? ST.daily[d].o / ST.daily[d].a : null);
  const w = 320, hh = 110, pad = 10;
  let pts = [], dots = '';
  vals.forEach((val, i) => {
    if (val === null) return;
    const x = pad + i * (w - 2 * pad) / 13, y = hh - pad - (hh - 2 * pad) * val;
    pts.push(x.toFixed(1) + ',' + y.toFixed(1));
    dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3" fill="var(--ac)"/>';
  });
  if (pts.length < 2) return '<div class="sub center" style="padding:18px 0">数据不足，多答几道题再来看趋势</div>';
  const grid = [0, .5, 1].map(g => {
    const y = hh - pad - (hh - 2 * pad) * g;
    return '<line x1="' + pad + '" y1="' + y + '" x2="' + (w - pad) + '" y2="' + y + '" stroke="var(--bd)" stroke-width="1"/>' +
      '<text x="' + (w - pad + 2) + '" y="' + (y + 3) + '" font-size="8" fill="var(--tx3)">' + (g * 100) + '</text>';
  }).join('');
  return '<svg viewBox="0 0 ' + w + ' ' + hh + '" style="width:100%">' + grid +
    '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' + dots + '</svg>';
}
function heatmapHTML() {
  let cells = '';
  for (let i = 83; i >= 0; i--) {
    const d = dateStr(new Date(Date.now() - i * 864e5));
    const a = ST.daily[d] ? ST.daily[d].a : 0;
    const cls = a > 30 ? 'l3' : a > 10 ? 'l2' : a > 0 ? 'l1' : '';
    cells += '<span class="hm-cell ' + cls + '" title="' + d + ' · ' + a + ' 题"></span>';
  }
  return '<div class="heatmap">' + cells + '</div>' +
    '<div class="hm-legend">少 <span class="hm-cell"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span> 多</div>';
}
function deptBarsHTML() {
  let h = '';
  QB.meta.depts.forEach((d, i) => {
    let c = 0, w = 0;
    idsOfDept(i).forEach(id => { const p = pq(id); if (p) { c += p.c; w += p.w; } });
    const n = c + w;
    h += '<div class="bar-row"><span class="bl">' + d.name + '</span>' +
      '<span class="bt"><i style="width:' + (n ? Math.round(c / n * 100) : 0) + '%"></i></span>' +
      '<span class="bv">' + (n ? Math.round(c / n * 100) + '%' : '--') + '</span></div>';
  });
  return h;
}
function typeChipsHTML() {
  let h = '<div class="row" style="flex-wrap:wrap;gap:8px">';
  for (let t = 0; t < 3; t++) {
    let c = 0, w = 0;
    idsOfType(t).forEach(id => { const p = pq(id); if (p) { c += p.c; w += p.w; } });
    const n = c + w;
    h += '<span class="chip">' + TYPE_NAMES[t] + '：' + (n ? Math.round(c / n * 100) + '%（' + n + ' 次）' : '未开始') + '</span>';
  }
  return h + '</div>';
}
function hardestHTML() {
  const ids = hardestIds(5);
  if (!ids.length) return '';
  let h = '<div class="card"><h3>最易错题 TOP5</h3>';
  ids.forEach(id => {
    const p = pq(id);
    h += '<div class="list-item" style="margin-bottom:8px" data-qid="' + id + '">' +
      '<div class="li-main"><div class="li-title" style="font-weight:500">' + esc(previewTxt(qText(id), 36)) + '</div>' +
      '<div class="li-sub">' + QB.meta.depts[qDept(id)].name + ' · ' + TYPE_SHORT[qType(id)] + ' · 错 ' + p.w + ' 次 / 对 ' + p.c + ' 次</div></div>' +
      '<span class="chip err">' + Math.round(p.w / (p.c + p.w) * 100) + '% 错</span></div>';
  });
  return h + '</div>';
}
function achHTML() {
  let h = '<div class="card"><h3>成就墙（' + Object.keys(ST.ach).length + ' / ' + ACHS.length + '）</h3><div class="ach-grid">';
  ACHS.forEach(a => {
    const got = ST.ach[a.id];
    h += '<div class="ach' + (got ? ' got' : '') + '"><b>' + (got ? '✓ ' : '') + a.n + '</b>' + a.d + (got ? '<div class="faint">' + fmtTs(got) + ' 达成</div>' : '') + '</div>';
  });
  return h + '</div></div>';
}

/* ---------- 错题本 ---------- */
var WB_SHOWN = 30;
ROUTES.wrong = function (v) {
  const ids = wrongIds();
  WB_SHOWN = 30;
  let h = '<div class="card tight">' +
    '<div class="spread"><div><b style="font-size:18px">' + ids.length + '</b> <span class="sub">道错题待消灭</span></div>' +
    '<div class="row" style="gap:8px"><button class="btn mini" id="wb-all">全部重练</button><button class="btn mini ghost" id="wb-rand">随机 20 题</button></div></div>' +
    '<div class="faint mt8">在任意练习中连续答对 2 次，错题自动移出错题本。</div></div>' +
    '<div id="wb-list"></div>' +
    (ids.length > WB_SHOWN ? '<button class="btn ghost block" id="wb-more">加载更多</button>' : '');
  v.innerHTML = h;
  const renderList = () => {
    const box = v.querySelector('#wb-list');
    box.innerHTML = ids.slice(0, WB_SHOWN).map(id => {
      const p = pq(id);
      return '<div class="list-item" data-qid="' + id + '">' +
        '<div class="li-main"><div class="li-title" style="font-weight:500">' + esc(previewTxt(qText(id), 40)) + '</div>' +
        '<div class="li-sub">' + QB.meta.depts[qDept(id)].name + ' · ' + TYPE_SHORT[qType(id)] + ' · 错 ' + p.w + ' 次 / 对 ' + p.c + ' 次</div></div>' +
        '<span class="chip err">错 ' + p.w + '</span></div>';
    }).join('');
    box.querySelectorAll('[data-qid]').forEach(el => {
      el.onclick = () => showQModal(+el.dataset.qid);
    });
  };
  renderList();
  const more = v.querySelector('#wb-more');
  if (more) more.onclick = () => { WB_SHOWN += 30; renderList(); if (WB_SHOWN >= ids.length) more.remove(); };
  v.querySelector('#wb-all').onclick = () => {
    if (!ids.length) return toast('错题本是空的');
    againWrong(ids);
  };
  v.querySelector('#wb-rand').onclick = () => {
    if (!ids.length) return toast('错题本是空的');
    const mk = () => startQuiz({ mode: 'wrong', label: '错题随机练', ids: sample(ids, Math.min(20, ids.length)), again: mk });
    mk();
  };
};
function showQModal(id) {
  const p = pq(id), opts = qOpts(id), ans = qAns(id);
  let oh = '';
  opts.forEach((o, i) => {
    const mark = ans.indexOf(i) >= 0;
    oh += '<div class="opt' + (mark ? ' ok' : ' dim') + '" style="cursor:default"><span class="opt-key">' + (qType(id) === 0 ? (i === 0 ? '√' : '×') : LETTERS[i]) + '</span><span>' + esc(o) + '</span></div>';
  });
  const hist = p ? '共答 ' + (p.c + p.w) + ' 次 · 对 ' + p.c + ' 次 · 错 ' + p.w + ' 次' + (p.lvl >= 0 ? ' · 记忆等级：' + LVL_NAMES[p.lvl] : '') : '尚未作答';
  showModal('<div class="q-badges"><span class="chip ac">' + TYPE_SHORT[qType(id)] + '</span><span class="chip">' + QB.meta.depts[qDept(id)].name + '</span></div>' +
    '<div class="q-text" style="font-size:15.5px">' + esc(qText(id)) + '</div>' +
    '<div class="opts">' + oh + '</div>' +
    '<div class="faint mt12">' + hist + '</div>' +
    '<div class="btn-row mt12"><button class="btn" id="qm-prac">练习此题</button>' +
    (p && p.wb ? '<button class="btn ghost" id="qm-rm">移出错题本</button>' : '') +
    '<button class="btn ghost" id="qm-close">关闭</button></div>');
  document.getElementById('qm-prac').onclick = () => { closeModal(); againSingle(id); };
  const rm = document.getElementById('qm-rm');
  if (rm) rm.onclick = () => { const pp = pq(id); pp.wb = 0; pp.wbOk = 0; save(); closeModal(); toast('已移出错题本'); if (curRoute === 'wrong') render(); };
  document.getElementById('qm-close').onclick = closeModal;
}

/* ---------- 皮肤中心 ---------- */
ROUTES.skins = function (v) {
  let h = '<div class="card tight sub">共 ' + THEMES.length + ' 款主题。所有皮肤均保证文字对比度，不影响阅读。点击立即切换。</div><div class="skin-grid">';
  THEMES.forEach(t => {
    h += '<button class="skin-card' + (ST.skin === t.id ? ' on' : '') + '" data-t="' + t.id + '">' +
      '<div class="skin-prev" style="background:' + t.c[0] + '">' +
      '<i style="height:44px;background:' + t.c[1] + ';border:1px solid rgba(0,0,0,.12)"></i>' +
      '<i style="height:30px;background:' + t.c[2] + '"></i>' +
      '<i style="height:20px;background:' + t.c[1] + ';opacity:.7"></i>' +
      '</div><div class="skin-info"><b>' + t.name + (ST.skin === t.id ? '<span class="skin-on">使用中</span>' : '') + '</b><span>' + t.desc + '</span></div></button>';
  });
  v.innerHTML = h + '</div>';
  v.querySelectorAll('.skin-card').forEach(el => {
    el.onclick = () => { applyTheme(el.dataset.t); toast('已切换：' + THEMES.find(t => t.id === el.dataset.t).name); go('skins'); };
  });
};

/* ---------- 设置 ---------- */
ROUTES.settings = function (v) {
  const m = QB.meta;
  v.innerHTML =
    '<div class="card"><h3>学习偏好</h3>' +
    '<div class="set-row"><div class="sr-l"><b>每日目标</b><span>首页进度环按此计算</span></div>' +
    '<input type="number" id="st-goal" min="5" max="500" value="' + ST.goal + '"></div>' +
    '<div class="set-row"><div class="sr-l"><b>答对自动跳下一题</b><span>答错时始终停留等待确认</span></div>' +
    '<div class="switch' + (ST.autoNext ? ' on' : '') + '" id="st-auto"><i></i></div></div>' +
    '</div>' +
    '<div class="card"><h3>数据管理</h3>' +
    '<div class="set-row"><div class="sr-l"><b>导出学习数据</b><span>备份进度，可迁移到其他设备</span></div><button class="btn mini ghost" id="st-exp">导出</button></div>' +
    '<div class="set-row"><div class="sr-l"><b>导入学习数据</b><span>覆盖当前设备数据</span></div><button class="btn mini ghost" id="st-imp">导入</button><input type="file" id="st-file" accept=".json,application/json" style="display:none"></div>' +
    '<div class="set-row"><div class="sr-l"><b>清空全部数据</b><span>进度、错题、成就全部重置</span></div><button class="btn mini danger" id="st-reset">清空</button></div>' +
    '</div>' +
    '<div class="card"><h3>题库信息</h3>' +
    '<div class="sub" style="line-height:2">' + m.title + ' · 共 ' + m.total + ' 题<br>' +
    m.types.map(t => t.name + ' ' + t.count + ' 题').join(' · ') + '<br>' +
    '部门：' + m.depts.map(d => d.name + '（' + d.count + '）').join('、') + '</div></div>' +
    '<div class="card"><h3>关于拾志</h3>' +
    '<div class="sub" style="line-height:1.9">拾志 v1.0 · 离线刷题工具<br>所有数据仅保存在本机浏览器中，无需联网、不上传。<br>建议定期在「数据管理」中导出备份。</div></div>';
  v.querySelector('#st-goal').onchange = e => {
    ST.goal = Math.max(5, Math.min(500, +e.target.value || 30)); save(); toast('每日目标：' + ST.goal + ' 题');
  };
  v.querySelector('#st-auto').onclick = e => {
    ST.autoNext = !ST.autoNext; e.currentTarget.classList.toggle('on', ST.autoNext); save();
  };
  v.querySelector('#st-exp').onclick = exportData;
  v.querySelector('#st-imp').onclick = () => v.querySelector('#st-file').click();
  v.querySelector('#st-file').onchange = e => { if (e.target.files[0]) importData(e.target.files[0]); };
  v.querySelector('#st-reset').onclick = () => {
    showModal('<h3>确认清空全部数据？</h3><div class="sub">答题记录、错题本、成就、复习计划都将被删除，且无法恢复。</div>' +
      '<div class="btn-row mt16"><button class="btn danger" id="rs-yes">确认清空</button><button class="btn ghost" id="rs-no">取消</button></div>');
    document.getElementById('rs-no').onclick = closeModal;
    document.getElementById('rs-yes').onclick = () => {
      localStorage.removeItem(KEY); ST = defaults(); save(); applyTheme(ST.skin);
      closeModal(); toast('已清空'); go('home');
    };
  };
};

/* ---------- 结果页 ---------- */
ROUTES.result = function (v) {
  const R = PARAMS;
  const acc = R.total ? Math.round(R.correct / R.total * 100) : 0;
  let grade, gColor;
  if (R.mode === 'boss') { grade = R.win ? 'BOSS 已击破' : '挑战失败'; }
  else if (R.mode === 'life') { grade = '最高连对 ' + (R.maxStreak || 0) + ' 题'; }
  else if (R.mode === 'lightning') { grade = '得分 ' + R.score; }
  else { grade = acc >= 90 ? '优秀' : acc >= 75 ? '良好' : acc >= 60 ? '及格' : '再接再厉'; }
  const wrongRows = (R.rows || []).filter(r => !r.ok);
  let rows = (R.rows || []).map((r, i) => {
    const your = r.timeout ? '未作答' : (r.sel == null ? '--' : r.sel);
    return '<div class="res-row ' + (r.ok ? 'ok' : 'err') + '">' +
      '<span class="mark">' + (r.ok ? '✓' : '×') + '</span>' +
      '<span class="rq">' + esc(previewTxt(qText(r.id), 46)) + '</span>' +
      '<span class="ra">' + your + ' / ' + ansLetters(r.id) + '</span></div>';
  }).join('');
  v.innerHTML =
    '<div class="card res-hero">' +
    '<div class="res-score">' + (R.mode === 'lightning' ? R.score : acc + '%') + '</div>' +
    '<div class="res-grade">' + grade + '</div>' +
    '<div class="res-stats">' +
    '<div class="rs"><b>' + R.correct + ' / ' + R.total + '</b><span>答对题数</span></div>' +
    '<div class="rs"><b>' + fmtSec(R.timeSec || 0) + '</b><span>用时</span></div>' +
    '<div class="rs"><b>+' + (R.xp || 0) + '</b><span>经验值</span></div>' +
    '</div></div>' +
    '<div class="btn-row">' +
    (R.again ? '<button class="btn" id="rs-again">再来一组</button>' : '') +
    (wrongRows.length ? '<button class="btn ghost" id="rs-wrong">只练错题（' + wrongRows.length + '）</button>' : '') +
    '<button class="btn ghost" id="rs-home">回首页</button>' +
    '</div>' +
    (rows ? '<div class="card mt16"><h3>答题明细</h3>' + rows + '</div>' : '');
  v.querySelector('#rs-home').onclick = () => go('home');
  const again = v.querySelector('#rs-again');
  if (again) again.onclick = () => R.again();
  const wb = v.querySelector('#rs-wrong');
  if (wb) wb.onclick = () => startQuiz({ mode: 'wrong', label: '错题重练', ids: shuffle(wrongRows.map(r => r.id)) });
};
