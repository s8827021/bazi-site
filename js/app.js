import { calcSizhu } from './bazi.js';
import { solar2lunar } from './calendar.js';
import { renderBazi, renderMingge, renderDaYun, renderLiuNian } from './render-bazi.js';
import { renderZiwei, renderLiuNianSihua } from './render-ziwei.js';

function calculate() {
  const year   = parseInt(document.getElementById('inputYear').value);
  const month  = parseInt(document.getElementById('inputMonth').value);
  const day    = parseInt(document.getElementById('inputDay').value);
  const hour   = parseInt(document.getElementById('inputHour').value);
  const gender = document.getElementById('inputGender').value;

  const testDate = new Date(year, month - 1, day);
  if (testDate.getMonth() !== month - 1) {
    alert('日期無效，請確認月份與日期的組合');
    return;
  }

  document.getElementById('loadingMask').classList.add('active');
  setTimeout(() => {
    try {
      const sz     = calcSizhu(year, month, day, hour);
      const lunar  = solar2lunar(year, month, day);
      renderBazi(sz);
      renderMingge(sz);
      renderDaYun(sz, gender, year, month, day);
      renderLiuNian(year);
      renderZiwei(sz, gender, lunar, year);
      renderLiuNianSihua();
      const el = document.getElementById('results');
      el.style.display = 'block';
      el.scrollIntoView({ behavior:'smooth', block:'start' });
    } catch(e) {
      console.error(e);
      alert('計算錯誤：' + e.message);
    }
    document.getElementById('loadingMask').classList.remove('active');
  }, 500);
}

function switchTab(tab) {
  document.getElementById('baziPanel').style.display  = tab==='bazi'  ? 'block' : 'none';
  document.getElementById('ziweiPanel').style.display = tab==='ziwei' ? 'block' : 'none';
  document.getElementById('tab1').classList.toggle('active', tab==='bazi');
  document.getElementById('tab2').classList.toggle('active', tab==='ziwei');
}

// Init
(function init() {
  const yr = document.getElementById('inputYear');
  for (let y = 2060; y >= 1940; y--)
    yr.innerHTML += `<option value="${y}" ${y===2000?'selected':''}>${y}年</option>`;
  const mo = document.getElementById('inputMonth');
  for (let m = 1; m <= 12; m++)
    mo.innerHTML += `<option value="${m}" ${m===1?'selected':''}>${m}月</option>`;
  const da = document.getElementById('inputDay');
  for (let d = 1; d <= 31; d++)
    da.innerHTML += `<option value="${d}" ${d===1?'selected':''}>${d}日</option>`;
  document.getElementById('inputHour').value = '0';
  document.getElementById('inputName').value = '';
})();

// 暴露到全域供 HTML onclick 使用
window.calculate = calculate;
window.switchTab = switchTab;
