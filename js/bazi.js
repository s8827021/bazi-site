import { TG, DZ, CANGGAN, WX_GAN, WX_ZHI, YY_GAN, SHENG, KE } from './constants.js';
import { calcJieQi } from './calendar.js';

export function getShiShen(ri, other) {
  const w1 = WX_GAN[ri], w2 = WX_GAN[other];
  const y1 = YY_GAN[ri], y2 = YY_GAN[other];
  const same = y1 === y2;
  if (w1 === w2) return same ? '比肩' : '劫財';
  if (SHENG[w1] === w2) return same ? '食神' : '傷官';
  if (KE[w1] === w2)   return same ? '偏財' : '正財';
  if (KE[w2] === w1)   return same ? '偏官' : '正官';
  if (SHENG[w2] === w1) return same ? '偏印' : '正印';
  return '?';
}

// ============================================================
// 四柱計算
// ============================================================
export function calcSizhu(year, month, day, hour) {
  const hourZhi = Math.floor(hour / 2);

  // 年柱 (以立春為界)
  const jqs = calcJieQi(year);
  const lichun = jqs[2]; // 立春 index=2
  let lunarYear = year;
  if (month < 2 || (month === 2 && day <= lichun.day)) lunarYear--;

  const yGanIdx = (((lunarYear - 4) % 10) + 10) % 10;
  const yZhiIdx = (((lunarYear - 4) % 12) + 12) % 12;

  // 月柱 (以各月「節」為界，非「氣」)
  const monthJieIndices = [0,2,4,6,8,10,12,14,16,18,20,22];
  const jie = jqs[monthJieIndices[month - 1]];
  let adjMonth = (day <= jie.day) ? month - 1 : month;
  if (adjMonth <= 0) adjMonth += 12;
  const mZhiMap = [1,2,3,4,5,6,7,8,9,10,11,0];
  const mZhiIdx = mZhiMap[adjMonth - 1];
  const mGanBase = [2,4,6,8,0];
  const mGanIdx  = (mGanBase[yGanIdx % 5] + (mZhiIdx >= 2 ? mZhiIdx - 2 : mZhiIdx + 10)) % 10;

  // 日柱
  const base = new Date(1900, 0, 1);
  const target = new Date(year, month - 1, day);
  const diff = Math.floor((target - base) / 86400000);
  // 1900-01-01 = 甲戌日（六十甲子 index 10）
  const dGzIdx = ((diff + 10) % 60 + 60) % 60;
  const dGanIdx = dGzIdx % 10;
  const dZhiIdx = dGzIdx % 12;

  // 時柱
  const hGanBase = [0,2,4,6,8];
  const hGanIdx  = (hGanBase[dGanIdx % 5] + hourZhi) % 10;

  return {
    year:  { gan: TG[yGanIdx],  zhi: DZ[yZhiIdx]  },
    month: { gan: TG[mGanIdx],  zhi: DZ[mZhiIdx]  },
    day:   { gan: TG[dGanIdx],  zhi: DZ[dZhiIdx]  },
    hour:  { gan: TG[hGanIdx],  zhi: DZ[hourZhi]  },
    lunarYear
  };
}

export function getMingge(sz) {
  const ri = sz.day.gan;
  const mZhi = sz.month.zhi;
  const cg = CANGGAN[mZhi] || [];
  if (!cg.length) return '普通格';
  const mainCg = cg[0];
  const ss = getShiShen(ri, mainCg);
  if (ss === '比肩' || ss === '劫財') {
    const yangRenMap = {甲:'卯',丙:'午',戊:'午',庚:'酉',壬:'子'};
    if (yangRenMap[ri] === mZhi) return '羊刃格';
    for (let i = 1; i < cg.length; i++) {
      const ss2 = getShiShen(ri, cg[i]);
      if (ss2 !== '比肩' && ss2 !== '劫財') return ss2 + '格';
    }
    return '建祿格';
  }
  return ss + '格';
}

// 月令五行對應
const LING_WX = {寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',亥:'水',子:'水',辰:'土',未:'土',戌:'土',丑:'土'};

export function getBodyStrength(sz) {
  const ri = sz.day.gan;
  const riWx = WX_GAN[ri];
  const shengWo = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  let score = 0;

  // (1) 得令 (~40%)
  const mWx = LING_WX[sz.month.zhi];
  if (mWx === riWx) score += 40;
  else if (shengWo[riWx] === mWx) score += 30;
  else if (KE[mWx] === riWx) score -= 25;
  else if (SHENG[riWx] === mWx) score -= 10;

  // (2) 得地 (~30%)
  let diSupport = 0, diTotal = 0;
  [sz.year.zhi, sz.month.zhi, sz.day.zhi, sz.hour.zhi].forEach(z => {
    (CANGGAN[z] || []).forEach((g, i) => {
      const w = i === 0 ? 3 : (i === 1 ? 1.5 : 1);
      const gWx = WX_GAN[g];
      diTotal += w;
      if (gWx === riWx || shengWo[riWx] === gWx) diSupport += w;
    });
  });
  score += (diSupport / diTotal) * 30;

  // (3) 得勢 (~30%)
  let shiSupport = 0;
  [sz.year.gan, sz.month.gan, sz.hour.gan].forEach(g => {
    const gWx = WX_GAN[g];
    if (gWx === riWx || shengWo[riWx] === gWx) shiSupport++;
  });
  score += (shiSupport / 3) * 30;

  return score >= 50 ? '身強' : '身弱';
}

export function getXiYong(sz, strength) {
  const riWx = WX_GAN[sz.day.gan];
  const strong = (strength || getBodyStrength(sz)) === '身強';
  const shengWo = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  const keWo   = {木:'金',火:'水',土:'木',金:'火',水:'土'};
  const woSheng = SHENG;
  const woKe   = KE;

  if (strong) {
    return {
      xi: [keWo[riWx], woKe[riWx], woSheng[riWx]],
      ji: [shengWo[riWx], riWx]
    };
  } else {
    return {
      xi: [shengWo[riWx], riWx],
      ji: [keWo[riWx], woKe[riWx], woSheng[riWx]]
    };
  }
}

export function calcWuxing(sz) {
  const count = {木:0,火:0,土:0,金:0,水:0};
  [sz.year.gan,sz.year.zhi,sz.month.gan,sz.month.zhi,sz.day.gan,sz.day.zhi,sz.hour.gan,sz.hour.zhi]
    .forEach(c => { const wx = WX_GAN[c]||WX_ZHI[c]; if(wx) count[wx]++; });
  [sz.year.zhi,sz.month.zhi,sz.day.zhi,sz.hour.zhi]
    .forEach(z => (CANGGAN[z]||[]).forEach(g => count[WX_GAN[g]]++));
  return count;
}
