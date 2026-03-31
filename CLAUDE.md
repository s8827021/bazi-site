# Code Audit 報告 — bazi_ziwei.html

> 審查日期：2026-03-31
> 範圍：`index.html`（約 1565 行）

---

## 🔴 安全性問題

### 1. ~~XSS：姓名欄位未轉義直接注入 innerHTML~~ ✅ 已修復

**行數**：renderZiwei() 中央面板

```javascript
const name = document.getElementById('inputName').value || '命主';
// ...
`<div class="center-name">${name}</div>`
```

使用者輸入的姓名直接插入 `innerHTML`，可執行任意 HTML/JS。雖然目前為 self-XSS（無 URL 參數預填機制），但仍屬不良實踐。

```javascript
// ✅ 修正：加入轉義函式
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const name = escapeHtml(document.getElementById('inputName').value) || '命主';
```

---

## 🟡 潛在 Bug

### 2. ~~大運起運：出生日恰好落在「節」當天時計算錯誤~~ ✅ 已修復

**函式**：`calcDaYun()`

```javascript
// 順行：找出生日後最近的節
if (d2 > birthDate) { nearDate = d2; break; }
// 逆行：找出生日前最近的節
if (d2 < birthDate) { nearDate = d2; break; }
```

使用嚴格不等式（`>` / `<`），若出生日恰好是某「節」當天，該節被略過。順行時會找到下一個節（約 30 天後），導致起運歲數被高估約 10 歲。

```javascript
// ✅ 修正：順行用 >=
if (d2 >= birthDate) { nearDate = d2; break; }
```

### 3. ~~無效日期未攞截（2 月 30 日、31 日）~~ ✅ 已修復

**函式**：`init()` + `calculate()`

日期選擇列表固定顯示 1–31 日，不隨月份調整。`new Date(2000, 1, 30)` 在 JavaScript 中會自動溢位為 3 月 1 日，造成四柱與農曆轉換結果靜默錯誤。

```javascript
// ✅ 修正：在 calculate() 開頭加入驗證
const testDate = new Date(year, month - 1, day);
if (testDate.getMonth() !== month - 1) {
  alert('日期無效，請確認月份與日期的組合');
  return;
}
```

### 4. solar2lunar 日期差使用 `Math.round` 有 DST 風險

**函式**：`solar2lunar()`

```javascript
let offset = Math.round((target - d1) / 86400000);
```

`new Date(y, m-1, d)` 建立的是本地時間午夜。在有日光節約時間的時區，相鄰日期差可能是 23 或 25 小時，`Math.round` 雖然比 `Math.floor` 安全，但仍可能在極端情況出錯。

```javascript
// ✅ 更穩健的做法：使用 UTC
const toUTC = (y,m,d) => Date.UTC(y, m-1, d);
let offset = Math.round((toUTC(year,month,day) - toUTC(y,nm,nd)) / 86400000);
```

### 5. 閏月與紫微命宮計算

**函式**：`solar2lunar()` → `calcMingZhi()`

`solar2lunar()` 對閏月回傳的月份數字與正常月份相同（例如閏四月回傳 `4`）。在紫微斗數中，閏月的命宮定位各派有不同處理方式（前半依本月、後半依下月，或一律歸本月）。目前程式碼未區分閏月，可能導致閏月出生者命宮偏差一宮。

### 6. ~~solar2lunar 中的死碼變數 `d2`~~ ✅ 已修復

**函式**：`solar2lunar()`

```javascript
const d2 = new Date(y + (nm2 < nm ? 1 : ...), nm2 - 1, nd2);
// ↑ 從未使用，下一行直接用 d2real 取代
const d2real = nextNY ? new Date(y + 1, nextNY[0] - 1, nextNY[1]) : ...;
```

`d2` 和 `[nm2, nd2]` 為死碼，可移除以減少混淆。

---

## 🟠 精度與邏輯問題

### 7. 節氣計算為估算公式，可偏差 1–2 天

**函式**：`calcJieQi()`

```javascript
const d = Math.floor(y * 0.2422 + c + C) - Math.floor((y - 1) / 4);
```

此為「壽星萬年曆」簡化公式，世紀修正值 `C` 統一為 -0.5（2000 年後）或 0（之前），但各節氣的世紀修正應有所不同。對某些年份的節氣日期可能偏差 1–2 天，直接影響：

- **年柱**（立春界線）— 立春當天出生者可能被錯判年柱
- **月柱**（各月節界線）— 月節當天出生者可能被錯判月柱
- **大運起運歲數** — 距離最近節的天數偏差

| 影響層級 | 說明 |
|----------|------|
| 99% 使用者 | 正常，偏差不影響（離節日超過 2 天）|
| ~1% 使用者 | 出生日恰在節氣前後 1–2 天，可能錯判 |

```javascript
// ✅ 徹底修正：改用節氣查表法（精確到日）或引入天文計算公式
// 或至少對 calcJieQi 補上世紀修正表（每個節氣不同的 C 值）
```

### 8. 月柱「節」界線使用 `<=` 的歧義

**函式**：`calcSizhu()`

```javascript
let adjMonth = (day <= jie.day) ? month - 1 : month;
```

「日 ≤ 節氣日」視為上一月。但節氣發生在當天某個時辰，若出生在節氣日但時辰在節氣時刻之後，應屬新月。目前無法處理此情境（需要更精確的節氣時刻資料）。

同理，年柱立春界線也有此問題：

```javascript
if (month < 2 || (month === 2 && day <= lichun.day)) lunarYear--;
```

### 9. ~~`getBodyStrength` 被重複呼叫~~ ✅ 已修復

**函式**：`renderMingge()` → `getXiYong()`

```javascript
// renderMingge() 中：
const strength = getBodyStrength(sz);  // 第一次呼叫
const xiyong   = getXiYong(sz);       // 內部再呼叫一次 getBodyStrength

// getXiYong() 中：
const strong = getBodyStrength(sz) === '身強';  // 第二次呼叫
```

同一組四柱運算兩次，浪費效能（雖然量小不影響使用）。

```javascript
// ✅ 修正：getXiYong 接受 strength 參數
function getXiYong(sz, strength) {
  const strong = strength === '身強';
  // ...
}
```

---

## 🔵 程式碼品質

### 10. ~~solar2lunar 靜默回退：回傳硬編碼預設值~~ ✅ 已修復

```javascript
return { year: year - 1, month: 12, day: 1 };
```

若日期超出 1940–2060 範圍或查表失敗，靜默回傳錯誤的農曆日期。使用者不會知道結果有誤。

```javascript
// ✅ 修正：拋出錯誤
throw new Error(`農曆轉換失敗：${year}/${month}/${day} 超出支援範圍 (1940-2060)`);
```

### 11. ~~Magic Number：日柱 epoch 偏移 +10 無註解~~ ✅ 已修復

```javascript
const dGzIdx = ((diff + 10) % 60 + 60) % 60;
```

`+10` 代表 1900-01-01 為甲戌日（六十甲子第 10 位），但缺少註解說明基準日。

```javascript
// ✅ 加註
// 1900-01-01 = 甲戌日（六十甲子 index 10）
const dGzIdx = ((diff + 10) % 60 + 60) % 60;
```

### 12. 未使用的 CSS class

以下 CSS class 已定義但 JS 渲染中從未產生：

| Class | 說明 |
|-------|------|
| `.star-aux` | 被 `.star-aux-item` 取代 |
| `.star-minor` | 未在任何渲染函式中使用 |
| `.brt-閒` | `BRT_LABEL` 將「閒」映為空字串，標籤不顯示 |

### 13. 大運 `startAge` 下限為 1 可能不符所有流派

```javascript
const startAge = Math.max(1, Math.round(diffDays / 3));
```

部分流派允許 0 歲起運（出生在節當天）。`Math.max(1, ...)` 硬性設下限。

---

## ⚪ 可用性與無障礙

### 14. 表單缺乏 label 關聯（年/月/日）

```html
<select id="inputYear" class="input-base"></select>
<select id="inputMonth" class="input-base"></select>
<select id="inputDay" class="input-base"></select>
```

這三個 `<select>` 無 `<label for="...">` 對應（外層有一個共用 label），螢幕閱讀器無法分辨各欄位。

### 15. 日選單不隨月份動態調整

固定顯示 1–31 日（見 Bug #3），UX 上容易選到無效日期，且使用者不會收到提示。

### 16. 紫微盤在小螢幕下宮格過小

`aspect-ratio: 1/1` 搭配 4×4 grid，在 375px 寬螢幕上每宮僅約 90px 寬，星曜文字會截斷或溢出。

---

## ✅ 做得好的地方

- **索引系統一致**：全面使用 DZ-index（子=0），資料表與演算法對齊
- **紫微安星經驗證**：calcZiwei、BRIGHTNESS 均對照 iztro 套件驗證 100% 一致
- **身強弱三因子加權**：得令/得地/得勢分離計算，可讀性高
- **CSS 自訂屬性**：配色集中管理，後續調整方便
- **無外部依賴**：除字型外零依賴，載入快速、無供應鏈風險
- **暖色淺色主題**：護眼設計，對比度適當

---

## 優先修復建議

| 優先級 | 項目 | 影響 |
|--------|------|------|
| **P0** | ~~#1 姓名 XSS 轉義~~ | ✅ 已修復 |
| **P1** | ~~#2 大運起運節日邊界~~ | ✅ 已修復 |
| **P1** | ~~#3 無效日期攞截~~ | ✅ 已修復 |
| **P2** | #5 閏月命宮處理 | 少數案例正確性 |
| **P2** | #7 節氣精度 | 邊界案例正確性 |
| **P2** | ~~#10 solar2lunar 錯誤處理~~ | ✅ 已修復 |
| **P3** | ~~#6 移除死碼~~ | ✅ 已修復 |
| **P3** | ~~#9 消除重複呼叫~~ | ✅ 已修復 |
| **P3** | ~~#11 補 magic number 註解~~ | ✅ 已修復 |
