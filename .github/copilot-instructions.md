# Copilot Instructions — 八字紫微斗數命盤計算器

## 專案概述

單檔 HTML 應用（`index.html`，約 1565 行），整合**八字命理**與**紫微斗數**兩大命學系統。純前端實作，無後端、無框架、無建構工具。

- **部署**：GitHub Pages / Netlify（自動從 `main` 分支部署）
- **GitHub**：`https://github.com/s8827021/bazi-site.git`
- **語言**：繁體中文（`lang="zh-TW"`）

## 技術棧

| 層級 | 技術 |
|------|------|
| HTML | 單檔，含 `<style>` + `<script>` |
| CSS | 手寫，無 Tailwind，暖色淺色主題 |
| JS | ES6+ Vanilla JavaScript，無框架 |
| 字型 | Google Fonts CDN（Noto Sans TC + Inter）|
| 外部依賴 | 無（僅 Google Fonts CDN）|

## 檔案結構

```
bazi-site/
├── index.html          # 唯一的應用檔案（~1565 行）
└── .github/
    └── copilot-instructions.md
```

### index.html 內部結構

| 行數範圍 | 區塊 | 說明 |
|----------|------|------|
| 1–7 | `<head>` | meta、title、Google Fonts |
| 8–565 | `<style>` | 完整 CSS（暖色淺色主題）|
| 566–680 | `<body>` HTML | loading mask、header、輸入表單、結果面板（雙分頁）|
| 681–710 | JS 常數 | TG/DZ/CANGGAN/WX 映射/SHENG/KE/SS_CLASS |
| 711–830 | 八字核心 | getShiShen、calcJieQi、solar2lunar、calcSizhu |
| 830–940 | 命理分析 | getMingge、getBodyStrength、getXiYong、calcWuxing |
| 940–1000 | 大運流年 | calcDaYun、getLiuNian |
| 1000–1070 | 紫微常數 | BRIGHTNESS（28星×12宮亮度）、SIHUA_TABLE（四化表）|
| 1070–1180 | 紫微核心 | calcZiwei、placePrimary、placeAux、calcMingZhi、getMingGan |
| 1180–1480 | 渲染函式 | renderBazi、renderMingge、renderDaYun、renderLiuNian、renderZiwei、renderLiuNianSihua |
| 1480–1565 | 主程式 | calculate()、switchTab()、init() |

## 主題配色

暖色淺色主題，注重眼睛舒適度：

| 用途 | 色碼 | 說明 |
|------|------|------|
| 背景 | `#EDE9E3` | 暖灰底色 |
| 卡片 | `#F6F4F0` | 米白卡片 |
| 主文字 | `#1E2A36` | 深色高對比 |
| 次要文字 | `#495A6A` | 中灰 |
| 淡化文字 | `#6B7B8D` | 輔助資訊 |
| 主色調 | `#3D6196` | 藍灰色（primary）|
| 邊框 | `#D4CDC4` | 暖灰邊框 |

## 核心架構

### 資料流

```
使用者輸入 (年/月/日/時/性別)
  │
  ├─→ calcSizhu()          → 四柱（年月日時干支）
  │     ├─→ solar2lunar()   → 農曆日期
  │     └─→ calcJieQi()     → 節氣判定
  │
  ├─→ 八字分析
  │     ├─→ getMingge()      → 格局（正官格、食神格...）
  │     ├─→ getBodyStrength()→ 身強/身弱（加權三因子）
  │     ├─→ getXiYong()      → 喜用神/忌用神
  │     └─→ calcWuxing()     → 五行分布統計
  │
  ├─→ calcDaYun()           → 大運（起運歲數 + 10期）
  ├─→ getLiuNian()           → 流年干支
  │
  └─→ 紫微斗數
        ├─→ calcMingZhi()    → 命宮地支
        ├─→ getMingGan()     → 命宮天干（五虎遁）
        ├─→ calcZiwei()      → 紫微星位置（iztro 演算法）
        ├─→ placePrimary()   → 14主星安星
        └─→ placeAux()       → 輔星安星
```

### 索引慣例（重要）

- **天干 TG[0–9]**：甲乙丙丁戊己庚辛壬癸
- **地支 DZ[0–11]**：子(0)、丑(1)、寅(2)、卯(3)、辰(4)、巳(5)、午(6)、未(7)、申(8)、酉(9)、戌(10)、亥(11)
- **BRIGHTNESS 陣列**：以 DZ-index（子=0）為索引，非宮位索引
- **p12(i)**：`((i % 12) + 12) % 12`，安全取模，處理負數

### 關鍵演算法

#### calcZiwei（紫微安星法）
- 參考：[SylarLong/iztro](https://github.com/SylarLong/iztro) `getStartIndex`
- 使用 do-while 迴圈，以農曆日數 + 五行局數計算紫微星宮位
- 口訣：「局數除日數，商數宮前走；若見數無餘，便要起虎口」
- 輸出為 DZ-index（子=0）

#### placePrimary（14主星）
- 紫微系（逆布）：紫微、天機、太陽、武曲、天同、廉貞
- 天府系（順布）：天府 = p12(4 - 紫微idx)，太陰、貪狼、巨門、天相、天梁、七殺、破軍

#### getBodyStrength（身強弱判定）
- 加權三因子，滿分 100，閾值 50
  - 得令（月令）：40%
  - 得地（地支藏干）：30%
  - 得勢（天干五行）：30%

#### getXiYong（喜用神）
- 身強：3 喜 + 2 忌（宜洩耗克）
- 身弱：2 喜 + 3 忌（宜生扶）

### 渲染模式

- **renderBazi**：四柱表格 + 藏干表格，使用 `innerHTML` 模板
- **renderZiwei**：4×4 CSS Grid 宮格，中央為命主資訊面板
  - 排列順序（順時針從巳）：巳午未申 → 酉戌 → 亥子丑寅 → 卯辰
  - `boardZhi = [5,6,7,8,9,10,11,0,1,2,3,4]`
- **switchTab**：雙分頁切換（八字/紫微），`display: block/none`

### UI 互動

- 輸入：5 個 `<select>`（年/月/日/時/性別）+ 姓名 `<input>`
- 計算按鈕觸發 `calculate()`，使用 `setTimeout` 包裹以顯示 loading mask
- 結果分兩個 tab：`#baziPanel`（四柱/藏干/命格/大運/流年）、`#ziweiPanel`（紫微盤/流年四化）

## 編碼規範

### JavaScript
- ES6+：箭頭函式、模板字串、解構賦值、const/let
- DOM 操作使用原生 API（getElementById、innerHTML）
- 函式命名 camelCase，以功能分組：`calc*`（計算）、`render*`（渲染）、`get*`（取值）、`place*`（安星）
- 所有星曜常數使用中文字串作為 key

### CSS
- 使用 CSS 自訂屬性（`--primary`、`--text-main` 等）
- RWD 斷點：640px、500px
- 宮格使用 CSS Grid（4 欄，中央 span 2×2）
- 亮度標籤：`.brt-tag.brt-廟`、`.brt-旺`、`.brt-得`、`.brt-陷`（中文 class 名）
- 四化標籤：`.sihua-lu`、`.sihua-quan`、`.sihua-ke`、`.sihua-ji`

### 命名慣例

| 變數 | 說明 |
|------|------|
| `sz` | 四柱物件 `{year:{gan,zhi}, month:{gan,zhi}, day:{gan,zhi}, hour:{gan,zhi}, lunarYear}` |
| `ri` | 日主天干（`sz.day.gan`）|
| `mingIdx` | 命宮地支索引（DZ-index）|
| `zwIdx` | 紫微星地支索引 |
| `juForCalc` / `juVal` | 五行局數（2/3/4/5/6）|
| `yGanIdx` / `yZhiIdx` | 年干/年支索引 |
| `pData` | 12 宮格星曜資料（key = zhiIdx）|
| `primary` | 14 主星位置 `{星名: zhiIdx}` |
| `aux` | 輔星位置 `{星名: zhiIdx}` |

## 資料表

| 常數 | 說明 |
|------|------|
| `NY_TABLE` | 1940–2060 正月初一的國曆日期 |
| `MONTH_TABLE` | 每年農曆月份天數 + 閏月資訊 |
| `JQ_C` | 24 節氣計算係數 |
| `CANGGAN` | 地支藏干（本氣/中氣/餘氣）|
| `BRIGHTNESS` | 28 星 × 12 宮亮度（廟/旺/得/利/平/閒/陷）|
| `SIHUA_TABLE` | 10 天干的四化（祿/權/科/忌）|
| `NAYIN60` | 六十甲子納音五行 |
| `JU_FROM_NAYIN` | 納音→五行局數映射 |

## 參考來源

- **紫微斗數安星法**：[SylarLong/iztro](https://github.com/SylarLong/iztro)（calcZiwei 演算法、BRIGHTNESS 亮度表均已驗證與 iztro npm 套件 100% 一致）
- **亮度表索引轉換**：iztro 使用宮位索引（寅=0），本專案使用 DZ-index（子=0），轉換公式：`our[i] = iztro[(i+10)%12]`

## 注意事項

- 這是**單檔應用**，所有修改都在 `index.html` 內完成
- BRIGHTNESS 陣列索引為 DZ-index（子=0），不是宮位索引（寅=0），修改時務必注意
- `calcZiwei` 的 do-while 演算法經過驗證，勿任意修改
- 農曆轉換表（NY_TABLE/MONTH_TABLE）涵蓋 1940–2060，超出範圍會出錯
- 無 XSS 轉義函式（非使用者生成內容的場景，姓名欄僅用於紫微盤中央顯示）
- loading mask 使用 `setTimeout(500ms)` 延遲以確保 UI 更新
