# 奇趣果宝消（零成本与分包架构改造）Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 去除微信云托管后端服务与世界排行，将全量素材经高质量压缩后拆入微信小游戏分包 (Subpackages) 中，实现 0 元月成本并保障老玩家数据无损平稳运行。

**Architecture:** 
1. 客户端剥离所有 `wx.cloud.callContainer` 远程调用，存档全面收敛到手机本地 `wx.setStorageSync`；
2. 排行榜 UI 移除“世界榜”和昵称设置流程，全面聚焦并固定为微信官方开放数据域（好友排行榜）；
3. 编写自动化压缩打包脚本，将 27MB 素材深度瘦身至 ~7MB，并按核心/进阶主题拆分到两个合规分包 (`subCoreAssets` 与 `subThemeAssets`)；
4. 改造资源引用路径直连本地分包，并在小游戏加载层配置预加载和安全就绪检查。

**Tech Stack:** TypeScript, PixiJS v6, WeChat Minigame SDK, Subpackages, Python/Pillow/ffmpeg (资源构建处理)

---

### Task 1: 素材压缩与分包构建脚本设计与执行

**Files:**
- Create: `scripts/build_subpackages.py`
- Output: `subCoreAssets/` (目录)
- Output: `subThemeAssets/` (目录)

**Step 1: 编写 Python 资源压缩与自动分包脚本**
脚本需要满足：
1. 使用 `ffmpeg` 将 `assets/bgm_new.mp3` 压缩为 64kbps MP3（大小从 3.6MB 降至 ~750KB），保留高质量音效 `clear.wav`、`click.wav`。
2. 使用 Pillow 对 `assets/` 下的所有 PNG 图片进行调色板量化（8-bit PNG，RGBA 使用 FASTOCTREE 量化，RGB 背景图采用高品质量化），将每张 1MB 贴图压到 200KB~350KB。
3. 按照规则自动归类输出：
   - `subCoreAssets/`:
     - `audio/` (bgm_new.mp3, clear.wav, click.wav)
     - 基础棋盘与背景: `bg.png`, `game_board_bg*.png`, `tile_*.png`, `loading_art.png`
     - 初始主题贴图: `sprite_fruits*.png`, `sprite_cats*.png`, `sprite_desserts*.png`
   - `subThemeAssets/`:
     - 解锁高阶主题贴图: `sprite_ocean*.png`, `sprite_cars*.png`, `sprite_animals*.png`, `sprite_succulents*.png`, `sprite_space*.png`, `sprite_sushi*.png`, `sprite_gems*.png`

**Step 2: 执行压缩脚本并验证分包体积**
Run: `python3 scripts/build_subpackages.py`
Expected:
- `subCoreAssets/` 总大小 ≤ 3.8MB (满足单个分包 ≤ 4MB)
- `subThemeAssets/` 总大小 ≤ 3.8MB (满足单个分包 ≤ 4MB)
- 全部分包总大小 ≤ 8MB (远低于微信 20MB 总包限制)

**Step 3: Commit**
```bash
git add scripts/build_subpackages.py subCoreAssets subThemeAssets
git commit -m "chore: add asset compression script and generate subpackages"
```

---

### Task 2: 微信小游戏配置适配 (`game.json` 与 `project.config.json`)

**Files:**
- Modify: `game.json`
- Modify: `project.config.json:49-101`

**Step 1: 修改 `game.json` 声明分包及启动预下载**
在 `game.json` 中添加 `subpackages` 列表与 `preloadRule`：
```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000,
    "connectSocket": 10000,
    "uploadFile": 10000,
    "downloadFile": 10000
  },
  "openDataContext": "openDataContext",
  "__usePrivacyCheck__": true,
  "subpackages": [
    {
      "name": "subCoreAssets",
      "root": "subCoreAssets/"
    },
    {
      "name": "subThemeAssets",
      "root": "subThemeAssets/"
    }
  ],
  "preloadRule": {
    "game": {
      "packages": ["subCoreAssets", "subThemeAssets"]
    }
  }
}
```

**Step 2: 修改 `project.config.json` 打包上传白名单**
检查 `packOptions.ignore`：
- 确保 `subCoreAssets` 和 `subThemeAssets` **不被 ignore**。
- 将原本被忽略的 `.png` 后缀规则调整，避免过滤掉分包中的 PNG 图片。

**Step 3: Commit**
```bash
git add game.json project.config.json
git commit -m "config: configure subpackages and preload rules in game.json"
```

---

### Task 3: 剥离后端与云存档逻辑，转为纯本地数据闭环 (`src/main.ts`)

**Files:**
- Modify: `src/main.ts:390-435`
- Modify: `src/main.ts:607-637`

**Step 1: 移除启动时的 `wx.cloud.callContainer` 同步云存档逻辑**
在 `src/main.ts:390-435` 处：
- 移除 `wx.cloud.init` 和 `wx.cloud.callContainer({ path: '/api/user/data', ... })`。
- 保留微信分享配置（`wx.showShareMenu`, `wx.onShareAppMessage`）。
- 启动时直接以 `wx.getStorageSync('playerData')` 的解析结果为准，确保老玩家现有手机本地进度 100% 维持不变。

**Step 2: 移除存档保存时的 `wx.cloud.callContainer` 备份逻辑**
在 `src/main.ts:607-637` 处：
- 移除 `savePlayerData` 中向 `/api/user/sync` 提交的数据同步请求。
- 保留 `wx.setStorageSync('playerData', dataStr)` 和向微信好友开放数据域上报关卡分数的 `wx.setUserCloudStorage`。

**Step 3: 检查编译**
Run: `npm run build`
Expected: 编译通过无类型错误。

**Step 4: Commit**
```bash
git add src/main.ts
git commit -m "refactor: remove cloud container user data sync and use local storage"
```

---

### Task 4: 排行榜 UI 与逻辑改造（剔除世界排行，保留好友排行）

**Files:**
- Modify: `src/main.ts:638-685` (移除世界排行分数提交)
- Modify: `src/main.ts:1040-1120` (移除世界排行Tab与初次起名弹窗)
- Modify: `src/main.ts:1375-1430` (移除世界排行拉取渲染函数 `fetchAndRenderGlobalRank`)

**Step 1: 移除 `submitToGlobalLeaderboard`**
- 删去向 `/api/leaderboard/submit` 上报分数的逻辑及自动生成/维护 `playerNickname` 的多余代码。

**Step 2: 简化排行榜弹窗 UI**
- 移除排行榜顶部的 `scopeFriendTab` 与 `scopeGlobalTab` 切换条及滑动背景块（排行榜固定展示好友榜）。
- 移除初次进入排行榜提示“起个响亮的名字...”的 `wx.showModal` 逻辑。
- 保留“主线关卡榜”和“每日挑战榜”切换功能，切换时通过 `wx.getOpenDataContext().postMessage` 命令开放数据域渲染对应的好友榜单。
- 隐藏/移除 `globalRankScrollContent` 与 `globalRankListContainer`。

**Step 3: 移除 `fetchAndRenderGlobalRank`**
- 彻底清理 `/api/leaderboard/top` 相关的网络请求代码与多余的渲染逻辑。

**Step 4: 检查编译**
Run: `npm run build`
Expected: 编译通过，无遗留未引用的变量或函数。

**Step 5: Commit**
```bash
git add src/main.ts
git commit -m "refactor: remove global leaderboard and streamline friend rank UI"
```

---

### Task 5: 静态资源引用路径迁移与分包就绪管理 (`src/main.ts`)

**Files:**
- Modify: `src/main.ts:15`
- Modify: `src/main.ts:184-220` (音频加载)
- Modify: `src/main.ts:690-740` (主题雪碧图贴图加载)
- Modify: `src/main.ts:815-830` (背景图加载)
- Modify: `src/main.ts:4010-4020` (砖块贴图加载)

**Step 1: 替换静态资源基地址与映射字典**
- 废弃远端 CDN 地址 `CLOUD_STORAGE_BASE`。
- 定义本地分包路径：
  ```typescript
  const CORE_ASSETS = 'subCoreAssets/';
  const THEME_ASSETS = 'subThemeAssets/';
  ```
- 将背景音乐与音效由网络下载改为本地加载：
  ```typescript
  bgmAudio.src = CORE_ASSETS + 'audio/bgm_new.mp3';
  // wav 音效直接引用本地路径，无需 wx.downloadFile
  ```
- 将各个精灵雪碧图与背景图映射到对应的 `CORE_ASSETS` 或 `THEME_ASSETS`。

**Step 2: 小游戏启动分包加载安全保障**
- 在游戏启动时，利用 `wx.loadSubpackage` 检查 `subCoreAssets` 就绪状态：
  ```typescript
  if (typeof wx !== 'undefined' && wx.loadSubpackage) {
      wx.loadSubpackage({
          name: 'subCoreAssets',
          success: () => {
              console.log('核心分包加载就绪');
          },
          fail: (err) => console.error('核心分包加载失败:', err)
      });
  }
  ```

**Step 3: 检查编译**
Run: `npm run build`
Expected: 编译成功生成 `dist/main.js`。

**Step 4: Commit**
```bash
git add src/main.ts
git commit -m "feat: migrate asset loading to local subpackages"
```

---

### Task 6: 构建、包体体积核验与端到端功能验证

**Files:**
- Modify: `dist/main.js` (构建产物)

**Step 1: 执行全量构建**
Run: `npm run build`
Expected: TypeScript 类型检查 0 报错，Vite 打包成功。

**Step 2: 核验主包与分包体积**
Run:
```bash
du -sh dist subCoreAssets subThemeAssets openDataContext game.js game.json
```
Expected:
- 主包文件 (`game.js`, `game.json`, `dist/main.js`, `openDataContext`) 总计 ≤ 1.5MB（限制 4MB）
- `subCoreAssets/` ≤ 3.8MB（限制 4MB）
- `subThemeAssets/` ≤ 3.8MB（限制 4MB）
- 全项目总包体积 ≤ 9MB（远低于 20MB）

**Step 3: 功能回归验证检查单**
1. 游戏冷启动：正常展示 Loading 并秒进主界面，无白屏。
2. 音频系统：BGM 循环播放顺畅，点击与消除音效正常播放。
3. 关卡与主题：默认水果主题正常显示，过关金币增加，商城更换主题（猫咪、多肉、宝石等）正常切图。
4. 微信好友榜：点击排行榜弹窗，正常展示好友排行画布，主线榜与每日榜切换正常。
5. 本地存档：退出小游戏重新打开，关卡、金币、已解锁主题完整保留。

**Step 4: Commit**
```bash
git add dist/
git commit -m "build: verify bundle size and complete e2e build validation"
```

---

### Task 7: 云端资源下线与止损操作（运维步骤）

**操作目标：彻底清零月度云服务账单**
1. **备份数据库（可选）**：进入微信云托管控制台，对现有的 `one_line_physics` 数据库做一次 SQL 数据导出（留作历史备份）。
2. **销毁云托管服务**：在微信云托管“服务管理”中，将 `golang-backend` 容器服务暂停并彻底删除。
3. **销毁云托管 MySQL 实例**：在微信云托管“数据库”中，注销/删除 MySQL 实例，**立即停止按小时扣费**。
4. **清理对象存储（COS）**：在云开发/对象存储控制台中，清空或停用原本存储素材的桶，彻底停止产生 CDN/COS 流量账单。
