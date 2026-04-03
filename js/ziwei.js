import { TG } from './constants.js';
import { p12 } from './utils.js';

export function calcMingZhi(lunarMonth, hourVal) {
  const hourZhi = Math.floor(hourVal / 2);
  return p12(1 + lunarMonth - hourZhi);
}

export function getMingGan(lunarYear, mingIdx) {
  const yGanIdx = (((lunarYear - 4) % 10) + 10) % 10;
  const yinBase = [2,4,6,8,0][yGanIdx % 5];
  const steps   = p12(mingIdx - 2);
  return TG[(yinBase + steps) % 10];
}

// 紫微安星法
export function calcZiwei(lunarDay, ju) {
  let offset = -1;
  let quotient;
  do {
    offset++;
    const divisor = lunarDay + offset;
    quotient = Math.floor(divisor / ju);
  } while ((lunarDay + offset) % ju !== 0);

  quotient = quotient % 12;
  let palaceIdx = quotient - 1;
  if (offset % 2 === 0) {
    palaceIdx += offset;
  } else {
    palaceIdx -= offset;
  }
  return p12(palaceIdx + 2);
}

export function placePrimary(zIdx) {
  const F = p12(4 - zIdx);
  return {
    紫微: zIdx,
    天機: p12(zIdx - 1),
    太陽: p12(zIdx - 3),
    武曲: p12(zIdx - 4),
    天同: p12(zIdx - 5),
    廉貞: p12(zIdx + 4),
    天府: F,
    太陰: p12(F + 1),
    貪狼: p12(F + 2),
    巨門: p12(F + 3),
    天相: p12(F + 4),
    天梁: p12(F + 5),
    七殺: p12(F + 6),
    破軍: p12(F + 10)
  };
}

export function placeAux(lunarYear, lunarMonth, lunarDay, hourVal) {
  const hourZhi = Math.floor(hourVal / 2);
  const yZhiIdx = (((lunarYear - 4) % 12) + 12) % 12;
  const yGanIdx = (((lunarYear - 4) % 10) + 10) % 10;
  const aux = {};
  aux['文昌'] = p12(10 - hourZhi);
  aux['文曲'] = p12(4 + hourZhi);
  aux['左輔'] = p12(lunarMonth + 3);
  aux['右弼'] = p12(11 - lunarMonth);
  const ky = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[6,2],[3,5],[3,5]];
  [aux['天魁'],aux['天鉞']] = ky[yGanIdx % 10];
  const luzon = [2,3,5,6,5,6,8,9,11,0][yGanIdx % 10];
  aux['祿存'] = luzon;
  aux['擎羊'] = p12(luzon + 1);
  aux['陀羅'] = p12(luzon - 1);
  const tianmaMap = {2:8,6:8,10:8, 8:2,0:2,4:2, 11:5,3:5,7:5, 5:11,9:11,1:11};
  aux['天馬'] = tianmaMap[yZhiIdx] ?? 2;
  aux['地空'] = p12(11 - hourZhi);
  aux['地劫'] = p12(11 + hourZhi);
  const huoBaseMap = {
    0:2, 4:2, 8:2,
    2:1, 6:1, 10:1,
    1:3, 5:3, 9:3,
    3:9, 7:9, 11:9
  };
  aux['火星'] = p12((huoBaseMap[yZhiIdx] ?? 2) + hourZhi);
  const lingBaseMap = {
    0:10, 4:10, 8:10,
    2:3,  6:3,  10:3,
    1:10, 5:10, 9:10,
    3:10, 7:10, 11:10
  };
  aux['鈴星'] = p12((lingBaseMap[yZhiIdx] ?? 10) + hourZhi);
  return aux;
}
