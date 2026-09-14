/* ============ 拾志 · 入口 ============ */
'use strict';

loadStore();
applyTheme(ST.skin);
document.getElementById('btn-back').onclick = goBack;
go('home');

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  });
}
