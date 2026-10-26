# 游戏 3D 贴图生成与处理标准流程 (Sprite Generation Prompt & Workflow)

为了确保后续生成的游戏贴图（如 3D 立体图标）抠图后边缘完美、没有白边或狗啃现象，请严格按照以下**提示词**和**处理脚本**进行操作。

## 1. AI 绘图提示词 (Prompt)

每次生成新皮肤图集时，直接复制以下英文提示词（只需替换其中的 `[主题名称]` 和具体的 `[9个物品清单]` 即可）：

```text
A 3x3 grid sprite sheet of cute [theme objects, e.g., baked goods and desserts], rendered in a 3D claymation toy style. Soft, smooth matte plastic or polymer clay texture, chunky, round, and cute, stereoscopic 3D. Arranged neatly in 3 rows and 3 columns on a SOLID DARK GREY BACKGROUND (#222222). NO SHADOWS ON THE GROUND. THE OBJECTS MUST BE FLOATING, ZERO DROP SHADOWS. Items include: [item 1, item 2, ..., item 9]. Clean edges, soft studio lighting, pastel colors, high resolution 3D render. STRICTLY NO TEXT. Solid dark grey (#222222) background.
```

**提示词核心奥秘解析：**
1. **`SOLID DARK GREY BACKGROUND (#222222)`**：强制使用与游戏本身深色 UI 相近的深灰色背景。这样即使抠图后边缘有抗锯齿像素残留，也全是深灰色，放到游戏里会自动融合，**彻底消除白边**。
2. **`NO SHADOWS ON THE GROUND. THE OBJECTS MUST BE FLOATING, ZERO DROP SHADOWS.`**：强制所有物品悬空，不能在地上有任何投影。否则阴影的渐变色会让抠图脚本失效，导致出现黑边残留。

## 2. 图片后处理脚本流程 (Post-Processing)

生成原图后，将图片重命名为需要的名字（例如 `sprite_new.png`）并放入 `public/assets/`，然后依次运行以下三个原生脚本即可：

```bash
# 1. 抠图：因为底色已经是干净的深灰色，基础版的抠图脚本即可完美处理
python3 remove_bg_grid.py public/assets/sprite_new.png

# 2. 扩充边距：让图标之间有安全距离，方便前端 CSS/Canvas 裁剪
python3 pad_tiles.py public/assets/sprite_new.png

# 3. 擦除死角：清理网格角上的杂色
python3 clean_corners.py public/assets/sprite_new.png
```

完成这三步后，出来的就是一张带透明通道、无白边、完美融入游戏深色背景的 `sprite_new.png` 了！

## 3. 更多有趣的皮肤类型灵感库 (Skin Theme Ideas)

这里为你构思了多种适合这种 3D 粘土质感的“新皮肤/图标”类型，你可以直接复制使用：

### 🎨 1. 魔法与炼金 (Magic & Alchemy)
- **主题**: magic potions, spell books, crystals, and wizard hats
- **物品清单**: purple round potion bottle, magic wand, glowing crystal, spell book, wizard hat, bubbling cauldron, magic scroll, flying broomstick, crystal ball
- **Prompt**: `A 3x3 grid sprite sheet of cute magic potions, spell books, crystals, and wizard hats, rendered in a 3D claymation toy style... Items include: purple round potion bottle, magic wand, glowing crystal, spell book, wizard hat, bubbling cauldron, magic scroll, flying broomstick, crystal ball. ...`

### 🍣 2. 日式寿司与料理 (Sushi & Japanese Cuisine)
- **主题**: delicious cute sushi, onigiri and japanese food
- **物品清单**: salmon nigiri, tuna nigiri, egg tamago sushi, shrimp nigiri, seaweed rice ball (onigiri), matcha teacup, tempura shrimp, salmon roe gunkan, dango skewer
- **Prompt**: `A 3x3 grid sprite sheet of delicious cute sushi, onigiri and japanese food, rendered in a 3D claymation toy style... Items include: salmon nigiri, tuna nigiri, egg tamago sushi, shrimp nigiri, seaweed rice ball (onigiri), matcha teacup, tempura shrimp, salmon roe gunkan, dango skewer. ...`

### 🪐 3. 宇宙星空 (Space & Planets)
- **主题**: cute planets, rockets and space exploration items
- **物品清单**: blue earth planet, saturn with rings, cute red rocket, astronaut helmet, glowing star, flying saucer UFO, moon with craters, telescope, shooting star
- **Prompt**: `A 3x3 grid sprite sheet of cute planets, rockets and space exploration items, rendered in a 3D claymation toy style... Items include: blue earth planet, saturn with rings, cute red rocket, astronaut helmet, glowing star, flying saucer UFO, moon with craters, telescope, shooting star. ...`

### 🌵 4. 多肉与治愈盆栽 (Succulents & Potted Plants)
- **主题**: cute succulent plants, cactus and tiny potted plants
- **物品清单**: round green cactus in a terracotta pot, pink succulent, aloe vera, hanging vine pot, tiny monstera leaf, terrarium jar, watering can, gardening trowel, blooming cactus
- **Prompt**: `A 3x3 grid sprite sheet of cute succulent plants, cactus and tiny potted plants, rendered in a 3D claymation toy style... Items include: round green cactus in a terracotta pot, pink succulent, aloe vera, hanging vine pot, tiny monstera leaf, terrarium jar, watering can, gardening trowel, blooming cactus. ...`

### 🎮 5. 复古游戏与电玩 (Retro Gaming)
- **主题**: retro gaming consoles, arcades and 8-bit game items
- **物品清单**: vintage gameboy, arcade cabinet, red joystick, directional d-pad, glowing pacman ghost, tetris block, golden coin, pixel heart, VR headset
- **Prompt**: `A 3x3 grid sprite sheet of retro gaming consoles, arcades and 8-bit game items, rendered in a 3D claymation toy style... Items include: vintage gameboy, arcade cabinet, red joystick, directional d-pad, glowing pacman ghost, tetris block, golden coin, pixel heart, VR headset. ...`

### 💎 6. 闪耀宝石与矿物 (Gems & Minerals)
- **主题**: sparkling precious gems, diamonds and crystals
- **物品清单**: brilliant cut diamond, red ruby teardrop, green emerald square, purple amethyst cluster, blue sapphire oval, gold nugget, treasure chest, pickaxe, raw quartz crystal
- **Prompt**: `A 3x3 grid sprite sheet of sparkling precious gems, diamonds and crystals, rendered in a 3D claymation toy style... Items include: brilliant cut diamond, red ruby teardrop, green emerald square, purple amethyst cluster, blue sapphire oval, gold nugget, treasure chest, pickaxe, raw quartz crystal. ...`
