import { TG, DZ, YY_GAN } from './constants.js';
import { escapeHtml, p12, get60Idx } from './utils.js';
import { calcMingZhi, getMingGan, calcZiwei, placePrimary, placeAux } from './ziwei.js';
import { getBrt, getBrtClass, BRT_LABEL, PALACE_NAMES, ZODIACS, SIHUA_TABLE, NAYIN60, JU_FROM_NAYIN } from './ziwei-data.js';
import { getLiuNian } from './dayun.js';

export function renderZiwei(sz, gender, lunarData, birthYear) {
  const hourVal   = parseInt(document.getElementById('inputHour').value);
  const lunarYear = sz.lunarYear;
  const yGanIdx   = (((lunarYear - 4) % 10) + 10) % 10;
  const yearGan   = TG[yGanIdx];
  const sihua     = SIHUA_TABLE[yearGan] || {};

  const mingIdx  = calcMingZhi(lunarData.month, hourVal);
  const shenIdx  = p12(1 + lunarData.month + Math.floor(hourVal/2));
  const mingGan  = getMingGan(lunarYear, mingIdx);

  const mingGanIdx = TG.indexOf(mingGan);
  const idx60_for_ju = get60Idx(mingGanIdx, mingIdx);
  const juForCalc    = JU_FROM_NAYIN[NAYIN60[idx60_for_ju]];
  const zwIdx    = calcZiwei(lunarData.day, juForCalc);
  const primary  = placePrimary(zwIdx);
  const aux      = placeAux(lunarYear, lunarData.month, lunarData.day, hourVal);

  const MINGZHU_BY_ZHI = ['貪狼','巨門','祿存','文曲','廉貞','武曲','破軍','武曲','廉貞','文曲','祿存','巨門'];
  const SHENZHU = ['火星','天相','天梁','天同','文昌','天機','火星','天相','天梁','天同','文昌','天機'];
  const idx60_m = get60Idx(mingGanIdx, mingIdx);
  const juVal   = JU_FROM_NAYIN[NAYIN60[idx60_m]];
  const mingzhu = MINGZHU_BY_ZHI[mingIdx];
  const yZhiIdx_z = (((lunarYear-4)%12)+12)%12;
  const shenzhu = SHENZHU[yZhiIdx_z];
  const gongGanBase = [0,2,4,6,8][yGanIdx % 5];

  // 建立宮格資料
  const pData = {};
  for (let i = 0; i < 12; i++) {
    const zhiIdx = p12(mingIdx - i);
    pData[zhiIdx] = { name: PALACE_NAMES[i], stars: [], aux: [], qaStars: [] };
  }
  Object.entries(primary).forEach(([star, idx]) => {
    if (!pData[idx]) pData[idx] = { stars:[], aux:[], qaStars:[] };
    let sh = '';
    if (star===sihua.lu) sh='lu'; else if (star===sihua.quan) sh='quan';
    else if (star===sihua.ke) sh='ke'; else if (star===sihua.ji) sh='ji';
    pData[idx].stars.push({ name:star, sh });
  });
  const QA_STARS = new Set(['擎羊','陀羅','地空','地劫','火星','鈴星']);
  Object.entries(aux).forEach(([star, idx]) => {
    if (!pData[idx]) pData[idx] = { stars:[], aux:[], qaStars:[] };
    let sh = '';
    if (star===sihua.lu) sh='lu'; else if (star===sihua.quan) sh='quan';
    else if (star===sihua.ke) sh='ke'; else if (star===sihua.ji) sh='ji';
    if (QA_STARS.has(star)) pData[idx].qaStars.push({ name:star, sh });
    else pData[idx].aux.push({ name:star, sh });
  });

  const forward = (yGanIdx % 2 === 0 && gender === 'male') || (yGanIdx % 2 !== 0 && gender === 'female');
  const curr = new Date().getFullYear();
  const boardZhi = [5,6,7,8,9,10,11,0,1,2,3,4];

  const cells = boardZhi.map((zhiIdx, pos) => {
    const pd = pData[zhiIdx] || { name:'', stars:[], aux:[], qaStars:[] };
    const isMing = zhiIdx === mingIdx;
    const isShen = zhiIdx === shenIdx;

    const daxianIndex = forward
      ? (zhiIdx - mingIdx + 12) % 12
      : (mingIdx - zhiIdx + 12) % 12;
    const daxianAge   = juVal + daxianIndex * 10;
    const daxianStart = birthYear + daxianAge;
    const isCurrDx = curr >= daxianStart && curr < daxianStart + 10;

    const gongGanIdx = (gongGanBase + zhiIdx) % 10;
    const gongGan = TG[gongGanIdx];

    const nameHtml = pd.name
      + (isMing?'<span class="sih-lu" style="font-size:9px;margin-left:2px;">命</span>':'')
      + (isShen?'<span class="sih-ke" style="font-size:9px;margin-left:2px;">身</span>':'');

    const auxHtml = pd.aux.map(a => {
      const brt = getBrt(a.name, zhiIdx);
      const brtCls2=getBrtClass(brt), brtLbl2=BRT_LABEL[brt]||'';
      const brtS = (brtCls2&&brtLbl2) ? `<span class="brt-tag brt-${brtCls2}">${brtLbl2}</span>` : '';
      const shS = a.sh ? `<span class="${a.sh==='ji'?'sih-ji':a.sh==='lu'?'sih-lu':a.sh==='ke'?'sih-ke':'sih-quan'}">${{lu:'祿',quan:'權',ke:'科',ji:'忌'}[a.sh]}</span>` : '';
      return `<div class="star-aux-item">${a.name}${brtS}${shS}</div>`;
    }).join('');
    const qaRow = pd.qaStars.length
      ? pd.qaStars.map(a=>{
          const brt=getBrt(a.name,zhiIdx);
          const brtCls3=getBrtClass(brt),brtLbl3=BRT_LABEL[brt]||'';
          const brtS=(brtCls3&&brtLbl3)?`<span class="brt-tag brt-${brtCls3}">${brtLbl3}</span>`:'';
          const shS=a.sh?`<span class="${a.sh==='ji'?'sih-ji':a.sh==='lu'?'sih-lu':a.sh==='ke'?'sih-ke':'sih-quan'}">${{lu:'祿',quan:'權',ke:'科',ji:'忌'}[a.sh]}</span>`:'';
          return `<div class="star-qa-item">${a.name}${brtS}${shS}</div>`;
        }).join('') : '';

    return `<div class="palace" style="${isCurrDx?'box-shadow:inset 0 0 0 1.5px var(--primary);':''}">
      ${isCurrDx?'<div class="palace-mark"></div>':''}
      <div class="palace-top-row">
        <span class="palace-name">${nameHtml}</span>
        <span class="palace-ganzhi">${gongGan}${DZ[zhiIdx]}</span>
      </div>
      <div class="palace-age">${daxianAge}～${daxianAge+9}歲</div>
      <div class="palace-stars">
        ${pd.stars.map(s=>{
          const brt=getBrt(s.name, zhiIdx);
          const brtCls=getBrtClass(brt);
          const brtLbl=BRT_LABEL[brt]||'';
          const brtHtml=(brtCls&&brtLbl)?`<span class="brt-tag brt-${brtCls}">${brtLbl}</span>`:'';
          const shHtml=s.sh?`<span class="sihua-tag sihua-${s.sh}">${{lu:'祿',quan:'權',ke:'科',ji:'忌'}[s.sh]}</span>`:'';
          return `<div class="star-main">${s.name}${brtHtml}${shHtml}</div>`;
        }).join('')}
        ${auxHtml||''}
        ${qaRow}
      </div>
    </div>`;
  });

  const name   = escapeHtml(document.getElementById('inputName').value) || '命主';
  const zodiac = ZODIACS[((lunarYear-4)%12+12)%12];
  const centerHtml = `
    <div class="palace-center">
      <div class="center-name">${name}</div>
      <div class="center-line"></div>
      <div class="center-info">
        ${gender==='male'?'男命':'女命'} · 命宮${DZ[mingIdx]}<br>
        身宮：${DZ[shenIdx]} · 生肖${zodiac}<br>
        ${lunarYear}農曆年（${yearGan}年）
      </div>
      <div class="center-line"></div>
      <div class="center-sihua" style="font-size:11px;line-height:2;">
        <span style="color:var(--text-secondary);">命主</span>
        <span style="color:var(--primary);font-weight:700;margin:0 4px;">${mingzhu}</span>
        <span style="color:var(--text-secondary);">身主</span>
        <span style="color:var(--primary);font-weight:700;margin-left:4px;">${shenzhu}</span>
        <br>
        <span style="color:var(--text-muted);font-size:10px;">本命四化</span><br>
        <span class="sih-lu">祿${sihua.lu}</span>
        <span class="sih-quan" style="margin:0 3px;">權${sihua.quan}</span>
        <span class="sih-ke">科${sihua.ke}</span>
        <span class="sih-ji" style="margin-left:3px;">忌${sihua.ji}</span>
      </div>
    </div>`;

  document.getElementById('ziweiBoard').innerHTML =
    cells[0] + cells[1] + cells[2] + cells[3] +
    cells[11] + centerHtml + cells[4] +
    cells[10] + cells[5] +
    cells[9] + cells[8] + cells[7] + cells[6];
}

export function renderLiuNianSihua() {
  const curr = new Date().getFullYear();
  const years = getLiuNian(curr - 5, 12);
  document.getElementById('liuNianSihua').innerHTML = years.map(yn => {
    const sh = SIHUA_TABLE[yn.gan] || {};
    const isCurr = yn.year === curr;
    const gc = YY_GAN[yn.gan] === '陽' ? '#D35400' : '#2980B9';
    return `<div class="sihua-card ${isCurr?'current':''}">
      <div class="liunian-year">${yn.year}</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">
        <span style="color:${gc};">${yn.gan}</span><span style="color:#495A6A;">${yn.zhi}</span>
      </div>
      <div style="font-size:10px;line-height:1.8;">
        <span class="sih-lu">祿:${sh.lu||'?'}</span><br>
        <span class="sih-quan">權:${sh.quan||'?'}</span><br>
        <span class="sih-ke">科:${sh.ke||'?'}</span><br>
        <span class="sih-ji">忌:${sh.ji||'?'}</span>
      </div>
    </div>`;
  }).join('');
}
