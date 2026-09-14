/* ============ 拾志 · 刷题引擎 ============ */
'use strict';

var SES = null, TICK = null, SUB_TIMER = null;

function stopAllTimers() {
  if (TICK) { clearInterval(TICK); TICK = null; }
  if (SUB_TIMER) { clearTimeout(SUB_TIMER); SUB_TIMER = null; }
}

/* ---------- 启动入口 ---------- */
function startQuiz(cfg) {
  stopAllTimers();
  if (!cfg.ids || !cfg.ids.length) { toast('该范围暂时没有题目'); return; }
  SES = {
    mode: cfg.mode, label: cfg.label || '练习',
    ids: cfg.ids.slice(), i: cfg.from || 0, scope: cfg.scope || null,
    rows: [], correct: 0, startTs: Date.now(),
    timeLimit: cfg.timeLimit || 0, timeLeft: cfg.timeLimit || 0,
    qLeft: 0, lives: (cfg.mode === 'life' || cfg.mode === 'boss') ? 3 : 0,
    bossHp: cfg.mode === 'boss' ? 100 : 0,
    score: 0, streak: 0, maxStreak: 0,
    answered: false, sel: new Set(), flipped: false, revealed: false,
    xpStart: ST.xp, againFn: cfg.again || null
  };
  go('session');
}
function startLightning() {
  startQuiz({ mode: 'lightning', label: '闪电挑战', ids: sample(allIds(), 15), again: startLightning });
}
function startLife() {
  startQuiz({ mode: 'life', label: '生命模式', ids: shuffle(allIds()), again: startLife });
}
function startBoss() {
  let ids = hardestIds(10);
  if (ids.length < 10) {
    const fill = sample(allIds().filter(i => ids.indexOf(i) < 0), 10 - ids.length);
    ids = shuffle(ids.concat(fill));
  }
  startQuiz({ mode: 'boss', label: 'BOSS 战', ids: ids, again: startBoss });
}
function startFlash(ids) {
  startQuiz({ mode: 'flash', label: '闪卡记忆', ids: ids, again: () => startFlash(shuffle(ids)) });
}
function startMemorize(ids) {
  startQuiz({ mode: 'memorize', label: '背题模式', ids: ids, again: () => startMemorize(shuffle(ids)) });
}
function againReview() {
  const d = dueIds().slice(0, 50);
  if (!d.length) { toast('暂时没有待复习项目'); go('review'); return; }
  startQuiz({ mode: 'review', label: '遗忘曲线复习', ids: d, again: againReview });
}
function againRand(scope, n, label) {
  const mk = () => startQuiz({ mode: 'random', label: label || '随机练习', ids: sample(poolOf(scope), n), again: mk });
  mk();
}
function againWrong(ids, label) {
  const mk = () => startQuiz({ mode: 'wrong', label: label || '错题重练', ids: shuffle(ids), again: mk });
  mk();
}
function againSingle(id) {
  const mk = () => startQuiz({ mode: 'single', label: '单题练习', ids: [id], again: mk });
  mk();
}

/* ---------- 会话渲染 ---------- */
ROUTES.session = function (v) {
  if (!SES) { go('home'); return; }
  if (SES.mode === 'flash') { drawFlash(v); return; }
  drawSession(v);
};

function heartsHTML() {
  const max = 3;
  let h = '<span class="hearts" id="hearts">';
  for (let i = 0; i < max; i++) h += '<span' + (i < SES.lives ? '' : ' class="lost"') + '>♥</span>';
  return h + '</span>';
}
function ansTextHTML(id) { return esc(ansText(id)).replace(/\n/g, '<br>'); }
function selLetters(arr) {
  const id = SES.ids[SES.i];
  if (qType(id) === 0) return arr[0] === 0 ? '正确' : '错误';
  return arr.map(i => LETTERS[i]).join('');
}

function drawSession(v) {
  const s = SES;
  if (s.i >= s.ids.length) { finishSession(); return; }
  const id = s.ids[s.i], t = qType(id), opts = qOpts(id);
  const isLife = s.mode === 'life';
  const totalTxt = isLife ? '已答 ' + s.rows.length + ' 题' : (s.i + 1) + ' / ' + s.ids.length;
  const pct = isLife ? Math.min(100, (s.rows.length % 20) * 5) : (s.i / s.ids.length * 100);

  let hud = '<div class="sess-hud">' +
    '<span class="hud-tag"><b>' + totalTxt + '</b></span>' +
    '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
    '<span class="hud-tag">对 <b>' + s.correct + '</b></span>';
  if (s.mode === 'life') hud += heartsHTML();
  if (s.mode === 'boss') hud += heartsHTML() + '<span class="hud-tag">BOSS</span><div class="boss-bar"><i id="boss-hp" style="width:' + s.bossHp + '%"></i></div>';
  if (s.mode === 'exam') hud += '<span class="chip ac" id="ex-clock">' + fmtSec(s.timeLeft) + '</span>';
  hud += '</div>';
  if (s.mode === 'lightning') hud += '<div class="timer-bar"><i id="lt-bar" style="width:100%"></i></div>';

  let body = '';
  if (s.mode === 'memorize') {
    body = s.revealed
      ? '<div class="feedback ok" style="color:var(--tx)"><div class="faint">参考答案</div><div class="fb-ans" style="margin-top:6px">' + ansTextHTML(id) + '</div></div>'
      : '<button class="btn block big ghost" id="mm-show">显示答案</button>';
  } else {
    let oh = '';
    opts.forEach((o, i) => {
      const key = t === 0 ? (i === 0 ? '√' : '×') : LETTERS[i];
      oh += '<button class="opt" data-i="' + i + '"><span class="opt-key">' + key + '</span><span>' + esc(o) + '</span></button>';
    });
    body = '<div class="opts">' + oh + '</div>' +
      (t === 2 ? '<div class="sess-foot"><button class="btn block" id="multi-sub" disabled>提交答案</button></div>' : '');
  }

  v.innerHTML = hud +
    '<div class="card q-card">' +
    '<div class="q-badges"><span class="chip ac">' + TYPE_SHORT[t] + '</span><span class="chip">' + QB.meta.depts[qDept(id)].name + '</span>' +
    (s.mode === 'review' && pq(id) && pq(id).lvl >= 0 ? '<span class="chip">记忆 · ' + LVL_NAMES[pq(id).lvl] + '</span>' : '') + '</div>' +
    '<div class="q-text">' + esc(qText(id)) + '</div>' +
    body +
    '<div id="fb-slot"></div>' +
    '</div>' +
    '<div class="sess-foot" id="foot-slot"></div>';

  if (s.mode === 'memorize') {
    if (!s.revealed) {
      v.querySelector('#mm-show').onclick = () => { s.revealed = true; drawSession(v); };
    } else {
      const foot = v.querySelector('#foot-slot');
      foot.innerHTML = '<button class="btn ghost" id="mm-no">还没记住</button><button class="btn ok" id="mm-yes">记住了</button>';
      v.querySelector('#mm-no').onclick = () => {
        recordAnswer(id, false, 'memorize');
        s.rows.push({ id: id, ok: false, sel: '--' });
        nextQ();
      };
      v.querySelector('#mm-yes').onclick = () => {
        recordAnswer(id, true, 'memorize');
        s.rows.push({ id: id, ok: true, sel: '--' });
        s.correct++;
        nextQ();
      };
    }
    return;
  }

  v.querySelectorAll('.opt').forEach(b => {
    b.onclick = () => chooseOpt(+b.dataset.i);
  });
  const ms = v.querySelector('#multi-sub');
  if (ms) ms.onclick = submitMulti;

  if (s.mode === 'exam') {
    if (TICK) clearInterval(TICK);
    TICK = setInterval(() => {
      s.timeLeft--;
      const c = document.getElementById('ex-clock');
      if (c) c.textContent = fmtSec(s.timeLeft);
      if (s.timeLeft <= 0) { toast('时间到，自动交卷'); finishSession(); }
    }, 1000);
  }
  if (s.mode === 'lightning') {
    s.qLeft = 10;
    if (TICK) clearInterval(TICK);
    TICK = setInterval(() => {
      s.qLeft = Math.max(0, s.qLeft - 0.1);
      const bar = document.getElementById('lt-bar');
      if (bar) bar.style.width = (s.qLeft * 10) + '%';
      if (s.qLeft <= 0) onTimeout();
    }, 100);
  }
}

function chooseOpt(idx) {
  const s = SES;
  if (s.answered) return;
  const id = s.ids[s.i];
  if (qType(id) === 2) {
    if (s.sel.has(idx)) s.sel.delete(idx); else s.sel.add(idx);
    document.querySelectorAll('.opt').forEach(b => {
      b.classList.toggle('sel', s.sel.has(+b.dataset.i));
    });
    const ms = document.getElementById('multi-sub');
    if (ms) ms.disabled = s.sel.size === 0;
    return;
  }
  judgeAnswer([idx]);
}
function submitMulti() {
  const s = SES;
  if (s.answered || s.sel.size === 0) return;
  judgeAnswer([...s.sel].sort((a, b) => a - b));
}
function onTimeout() {
  const s = SES;
  if (s.answered) return;
  s.answered = true;
  stopAllTimers();
  const id = s.ids[s.i];
  recordAnswer(id, false, s.mode);
  s.rows.push({ id: id, ok: false, sel: null, timeout: true });
  wrongEffects();
  paintOptions(id, []);
  showFeedback(false, id, '时间到');
  showNextButton();
}
function judgeAnswer(selArr) {
  const s = SES;
  if (s.answered) return;
  s.answered = true;
  stopAllTimers();
  const id = s.ids[s.i];
  const ok = JSON.stringify(selArr) === JSON.stringify(qAns(id));
  recordAnswer(id, ok, s.mode);
  s.rows.push({ id: id, ok: ok, sel: selLetters(selArr) });
  if (ok) {
    s.correct++;
    okEffects();
  } else {
    wrongEffects();
  }
  if (s.mode === 'seq' && s.scope) { ST.seq[s.scope] = s.i + 1; save(); }
  paintOptions(id, selArr);
  showFeedback(ok, id, '');
  showNextButton(ok);
}
function okEffects() {
  const s = SES;
  if (s.mode === 'lightning') s.score += 10 + Math.ceil(s.qLeft);
  if (s.mode === 'life') { s.streak++; s.maxStreak = Math.max(s.maxStreak, s.streak); }
  if (s.mode === 'boss') {
    s.bossHp = Math.max(0, s.bossHp - 10);
    const bar = document.getElementById('boss-hp');
    if (bar) bar.style.width = s.bossHp + '%';
  }
}
function wrongEffects() {
  const s = SES;
  if (s.mode === 'life' || s.mode === 'boss') {
    s.lives--;
    if (s.mode === 'life') s.streak = 0;
    const h = document.getElementById('hearts');
    if (h) h.outerHTML = heartsHTML();
  }
}
function paintOptions(id, selArr) {
  const ans = qAns(id);
  document.querySelectorAll('.opt').forEach(b => {
    const i = +b.dataset.i;
    b.onclick = null;
    if (ans.indexOf(i) >= 0) b.classList.add('ok');
    else if (selArr.indexOf(i) >= 0) b.classList.add('err');
    else b.classList.add('dim');
  });
  const ms = document.getElementById('multi-sub');
  if (ms) ms.remove();
}
function showFeedback(ok, id, note) {
  const p = pq(id);
  const n = p.c + p.w;
  const hist = '此题共答 ' + n + ' 次 · 正确率 ' + Math.round(p.c / n * 100) + '%';
  let head;
  if (note === '时间到') head = '时间到';
  else head = ok ? '回答正确' : '回答错误';
  let extra = '';
  if (!ok) extra = '<div class="fb-ans">正确答案：' + ansTextHTML(id) + '</div>';
  if (ok && SES.mode === 'review') extra = '<div class="fb-ans">记忆等级提升至「' + LVL_NAMES[p.lvl] + '」，' + fmtDue(p.next) + '再次复习</div>';
  document.getElementById('fb-slot').innerHTML =
    '<div class="feedback ' + (ok ? 'ok' : 'err') + '"><b>' + head + '</b>' + extra +
    '<div class="fb-hist">' + hist + '</div></div>';
}
function showNextButton(ok) {
  const s = SES;
  const foot = document.getElementById('foot-slot');
  const ended =
    (s.mode === 'life' && s.lives <= 0) ||
    (s.mode === 'boss' && (s.lives <= 0 || s.bossHp <= 0)) ||
    s.i + 1 >= s.ids.length;
  const label = ended
    ? ((s.mode === 'boss') ? '查看战果' : '查看结果')
    : '下一题';
  foot.innerHTML = (s.mode === 'exam' && !ended ? '<button class="btn ghost" id="nx-hand">交卷</button>' : '') +
    '<button class="btn" id="nx-btn">' + label + '</button>';
  document.getElementById('nx-btn').onclick = () => {
    if (ended) finishSession(); else nextQ();
  };
  const hand = document.getElementById('nx-hand');
  if (hand) hand.onclick = () => { toast('已交卷'); finishSession(); };
  if (ok && ST.autoNext && !ended &&
    ['seq', 'random', 'review', 'wrong', 'single', 'exam'].indexOf(s.mode) >= 0) {
    SUB_TIMER = setTimeout(nextQ, 850);
  }
}
function nextQ() {
  const s = SES;
  if (!s) return;
  stopAllTimers();
  s.i++;
  s.answered = false; s.sel = new Set(); s.revealed = false; s.flipped = false;
  if (s.mode === 'life' && s.i >= s.ids.length) { s.ids = shuffle(allIds()); s.i = 0; }
  if (s.i >= s.ids.length) { finishSession(); return; }
  drawSession(document.getElementById('view'));
}
function finishSession() {
  const s = SES;
  if (!s) { go('home'); return; }
  stopAllTimers();
  let win = null;
  if (s.mode === 'boss') {
    win = s.bossHp <= 0;
    if (win) { ST.best.boss++; toast('BOSS 被击败了'); }
  }
  if (s.mode === 'lightning' && s.score > ST.best.lightning) { ST.best.lightning = s.score; }
  if (s.mode === 'life' && s.maxStreak > ST.best.life) { ST.best.life = s.maxStreak; }
  checkAchs(); save();
  SES = null;
  go('result', {
    mode: s.mode, total: s.rows.length, correct: s.correct, score: s.score,
    timeSec: (Date.now() - s.startTs) / 1000, rows: s.rows,
    xp: ST.xp - s.xpStart, win: win, maxStreak: s.maxStreak, again: s.againFn
  });
}

/* ---------- 闪卡 ---------- */
function drawFlash(v) {
  const s = SES;
  if (s.i >= s.ids.length) { finishSession(); return; }
  const id = s.ids[s.i];
  v.innerHTML =
    '<div class="sess-hud">' +
    '<span class="hud-tag"><b>' + (s.i + 1) + ' / ' + s.ids.length + '</b></span>' +
    '<div class="pbar"><i style="width:' + (s.i / s.ids.length * 100) + '%"></i></div>' +
    '<span class="hud-tag">记住 <b>' + s.correct + '</b></span></div>' +
    '<div class="flash-scene"><div class="flash-card' + (s.flipped ? ' flip' : '') + '" id="fc-card">' +
    '<div class="flash-face front">' +
    '<div class="ff-tag">' + TYPE_SHORT[qType(id)] + ' · ' + QB.meta.depts[qDept(id)].name + '</div>' +
    '<div class="ff-q">' + esc(qText(id)) + '</div>' +
    '<div class="faint center">点击卡片翻面对答案</div>' +
    '</div>' +
    '<div class="flash-face back">' +
    '<div class="ff-tag">参考答案</div>' +
    '<div class="ff-a">' + ansTextHTML(id) + '</div>' +
    '</div>' +
    '</div></div>' +
    '<div class="sess-foot" id="fc-foot"></div>';
  const foot = v.querySelector('#fc-foot');
  if (!s.flipped) {
    foot.innerHTML = '<button class="btn ghost" id="fc-skip">跳过</button><button class="btn" id="fc-flip">翻面对答案</button>';
    v.querySelector('#fc-card').onclick = () => { s.flipped = true; drawFlash(v); };
    v.querySelector('#fc-flip').onclick = () => { s.flipped = true; drawFlash(v); };
    v.querySelector('#fc-skip').onclick = () => nextQ();
  } else {
    foot.innerHTML =
      '<div class="grade-row" style="width:100%">' +
      '<button class="btn danger" id="g-no">忘了</button>' +
      '<button class="btn ghost" id="g-mid">模糊</button>' +
      '<button class="btn ok" id="g-ok">记住了</button></div>';
    v.querySelector('#g-no').onclick = () => {
      recordAnswer(id, false, 'flash');
      s.rows.push({ id: id, ok: false, sel: '忘了' });
      nextQ();
    };
    v.querySelector('#g-mid').onclick = () => {
      fuzzyRecord(id);
      s.rows.push({ id: id, ok: true, sel: '模糊' });
      s.correct++;
      nextQ();
    };
    v.querySelector('#g-ok').onclick = () => {
      recordAnswer(id, true, 'flash');
      s.rows.push({ id: id, ok: true, sel: '记住' });
      s.correct++;
      nextQ();
    };
  }
}
function fuzzyRecord(id) {
  const p = ensurePQ(id);
  p.c++; p.last = Date.now();
  if (p.lvl < 0) p.lvl = 0;
  p.next = Date.now() + IV[1];
  if (p.wb) {
    p.wbOk = (p.wbOk || 0) + 1;
    if (p.wbOk >= 2) { p.wb = 0; p.wbOk = 0; ST.wbKilled++; }
  }
  ST.stats.ans++; ST.stats.ok++; ST.xp += 2;
  touchDaily(true); LAST_OK = true;
  checkAchs(); save();
}
