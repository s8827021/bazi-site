import { TG, DZ, YY_GAN } from './constants.js';
import { calcJieQi } from './calendar.js';

export function calcDaYun(sz, gender, y, m, d) {
  const isYangYear = YY_GAN[sz.year.gan] === '陽';
  const forward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female');

  const jqs = calcJieQi(y);
  const birthDate = new Date(y, m - 1, d);
  const jieIndices = [0,2,4,6,8,10,12,14,16,18,20,22];
  let nearDate;
  if (forward) {
    for (const ji of jieIndices) {
      const d2 = new Date(y, jqs[ji].month - 1, jqs[ji].day);
      if (d2 >= birthDate) { nearDate = d2; break; }
    }
    if (!nearDate) {
      const ny = calcJieQi(y + 1);
      nearDate = new Date(y + 1, ny[0].month - 1, ny[0].day);
    }
  } else {
    for (let k = jieIndices.length - 1; k >= 0; k--) {
      const ji = jieIndices[k];
      const d2 = new Date(y, jqs[ji].month - 1, jqs[ji].day);
      if (d2 <= birthDate) { nearDate = d2; break; }
    }
    if (!nearDate) {
      const py = calcJieQi(y - 1);
      nearDate = new Date(y - 1, py[22].month - 1, py[22].day);
    }
  }
  const diffDays = Math.abs(birthDate - nearDate) / 86400000;
  const startAge = Math.max(1, Math.round(diffDays / 3));

  const mGanIdx = TG.indexOf(sz.month.gan);
  const mZhiIdx = DZ.indexOf(sz.month.zhi);
  const p = (n, max) => ((n % max) + max) % max;

  return {
    startAge,
    dayuns: Array.from({length: 10}, (_, i) => {
      const step = forward ? i + 1 : -(i + 1);
      const age = startAge + i * 10;
      return {
        gan: TG[p(mGanIdx + step, 10)],
        zhi: DZ[p(mZhiIdx + step, 12)],
        startAge: age, endAge: age + 9,
        startYear: y + age
      };
    })
  };
}

export function getLiuNian(startYear, count) {
  return Array.from({length: count}, (_, i) => {
    const yr = startYear + i;
    return {
      year: yr,
      gan: TG[((yr - 4) % 10 + 10) % 10],
      zhi: DZ[((yr - 4) % 12 + 12) % 12]
    };
  });
}
