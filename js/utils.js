// ============================================================
// 工具函式
// ============================================================

export function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/** 安全取模（處理負數） */
export const p12 = (i) => ((i % 12) + 12) % 12;

/** 從干支索引推算六十甲子索引 */
export function get60Idx(ganIdx, zhiIdx) {
  for (let i = ganIdx; i < 60; i += 10) if (i % 12 === zhiIdx) return i;
  return ganIdx;
}
