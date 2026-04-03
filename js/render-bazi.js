import { WX_GAN, WX_ZHI, WX_COLORS, CANGGAN, YY_GAN, SS_CLASS } from './constants.js';
import { getShiShen, getMingge, getBodyStrength, getXiYong, calcWuxing } from './bazi.js';
import { calcDaYun, getLiuNian } from './dayun.js';
import { SIHUA_TABLE } from './ziwei-data.js';

export function renderBazi(sz) {
  const ri = sz.day.gan;
  const cols = [
    { label:'年　柱', ...sz.year, isDay:false },
    { label:'月　柱', ...sz.month, isDay:false },
    { label:'日　柱', ...sz.day, isDay:true },
    { label:'時　柱', ...sz.hour, isDay:false }
  ];

  const ganClass = g => YY_GAN[g] === '陽' ? 'stem-yang' : 'stem-yin';
  const ssBadge  = (ss) => `<span class="ss-badge ${SS_CLASS[ss]||''}">${ss}</span>`;

  document.getElementById('baziTable').innerHTML = `
    <thead><tr>
      <th style="width:72px;"> </th>
      ${cols.map(c=>`<th>${c.label}</th>`).join('')}
    </tr></thead>
    <tbody>
      <tr>
        <td class="row-label">十　神</td>
        ${cols.map(c => `<td>${c.isDay ? ssBadge('日主') : ssBadge(getShiShen(ri,c.gan))}</td>`).join('')}
      </tr>
      <tr>
        <td class="row-label">天　干</td>
        ${cols.map(c=>`<td class="cell-tiangan ${ganClass(c.gan)}">${c.gan}</td>`).join('')}
      </tr>
      <tr>
        <td class="row-label">地　支</td>
        ${cols.map(c=>`<td class="cell-dizhi">${c.zhi}</td>`).join('')}
      </tr>
      <tr>
        <td class="row-label">五　行</td>
        ${cols.map(c=>`<td style="font-size:13px;">
          <span style="color:${WX_COLORS[WX_GAN[c.gan]]};">${WX_GAN[c.gan]}</span>
          <span style="color:#B8AFA5;"> / </span>
          <span style="color:${WX_COLORS[WX_ZHI[c.zhi]]};">${WX_ZHI[c.zhi]}</span>
        </td>`).join('')}
      </tr>
    </tbody>`;

  // 藏干
  let cgHtml = `<thead><tr>
    <th style="width:72px;"> </th>
    ${cols.map(c=>`<th>${c.zhi}（${WX_ZHI[c.zhi]}）</th>`).join('')}
  </tr></thead><tbody>`;
  ['本氣','中氣','餘氣'].forEach((lbl, i) => {
    cgHtml += `<tr><td class="row-label">${lbl}</td>`;
    cols.forEach(c => {
      const cg = CANGGAN[c.zhi] || [];
      if (cg[i]) {
        const ss = getShiShen(ri, cg[i]);
        cgHtml += `<td>
          <span class="${ganClass(cg[i])}" style="font-size:17px;font-weight:700;">${cg[i]}</span>
          ${ssBadge(ss)}
        </td>`;
      } else {
        cgHtml += `<td style="color:#B8AFA5;">—</td>`;
      }
    });
    cgHtml += '</tr>';
  });
  cgHtml += '</tbody>';
  document.getElementById('cangganTable').innerHTML = cgHtml;
}

export function renderMingge(sz) {
  const mingge   = getMingge(sz);
  const strength = getBodyStrength(sz);
  const xiyong   = getXiYong(sz, strength);
  const wxCount  = calcWuxing(sz);

  document.getElementById('minggeSection').innerHTML = `
    <div class="section-divider"><span class="section-title">命 格 分 析</span></div>
    <div class="mingge-grid">
      <div>
        <div class="badge-row">
          <span class="info-badge badge-purple">格局：${mingge}</span>
          <span class="info-badge ${strength==='身強'?'badge-red':'badge-water'}">日元：${strength}</span>
          <span class="info-badge badge-green">日主：${sz.day.gan}（${WX_GAN[sz.day.gan]}）</span>
        </div>
        <div style="margin-bottom:12px;">
          <div class="sub-label">喜用神（${strength === '身強' ? '宜洩耗克' : '宜生扶'}）</div>
          <div class="badge-row">
            ${xiyong.xi.map(wx=>`<span class="info-badge xi-badge" style="border-color:${WX_COLORS[wx]}55;color:${WX_COLORS[wx]};">喜 ${wx}</span>`).join('')}
          </div>
        </div>
        <div>
          <div class="sub-label">忌用神（${strength === '身強' ? '忌生扶' : '忌洩耗克'}）</div>
          <div class="badge-row">
            ${xiyong.ji.map(wx=>`<span class="info-badge ji-badge" style="border-color:${WX_COLORS[wx]}55;">忌 ${wx}</span>`).join('')}
          </div>
        </div>
      </div>
      <div>
        <div class="sub-label">五行分布</div>
        ${['木','火','土','金','水'].map(wx => `
          <div class="wx-bar-row">
            <span class="wx-label" style="color:${WX_COLORS[wx]};">${wx}</span>
            <div class="wx-track">
              <div class="wx-fill" style="width:${Math.min(100,wxCount[wx]*13)}%;background:${WX_COLORS[wx]};"></div>
            </div>
            <span class="wx-count">${wxCount[wx]}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

export function renderDaYun(sz, gender, y, m, d) {
  const curr = new Date().getFullYear();
  const { startAge, dayuns } = calcDaYun(sz, gender, y, m, d);
  let html = `<div class="dayun-header">起運歲數：${startAge} 歲</div><div class="dayun-grid">`;
  dayuns.forEach(dyn => {
    const isCurr = curr >= dyn.startYear && curr < dyn.startYear + 10;
    const gc = YY_GAN[dyn.gan] === '陽' ? '#D35400' : '#2980B9';
    html += `<div class="dayun-item ${isCurr?'current':''}">
      <div class="dayun-age">${dyn.startAge}～${dyn.endAge}歲</div>
      <div class="dayun-year">${dyn.startYear}</div>
      <div class="dayun-stem" style="color:${gc};">${dyn.gan}</div>
      <div class="dayun-branch">${dyn.zhi}</div>
      ${isCurr?'<div class="dayun-cur-tag">▶ 當前</div>':''}
    </div>`;
  });
  html += '</div>';
  document.getElementById('dayunContainer').innerHTML = html;
}

export function renderLiuNian(birthYear) {
  const curr = new Date().getFullYear();
  const years = getLiuNian(curr - 5, 18);
  document.getElementById('liuNianGrid').innerHTML = years.map(yn => {
    const isCurr = yn.year === curr;
    const sh = SIHUA_TABLE[yn.gan] || {};
    const gc = YY_GAN[yn.gan] === '陽' ? '#D35400' : '#2980B9';
    return `<div class="liunian-item ${isCurr?'current':''}">
      <div class="liunian-year">${yn.year}</div>
      <div class="liunian-gz">
        <span style="color:${gc};">${yn.gan}</span><span style="color:#495A6A;">${yn.zhi}</span>
      </div>
      <div class="liunian-sh">
        <span style="color:#1B6D28;">祿:${sh.lu||'?'}</span><br>
        <span style="color:#A12020;">忌:${sh.ji||'?'}</span>
      </div>
    </div>`;
  }).join('');
}
