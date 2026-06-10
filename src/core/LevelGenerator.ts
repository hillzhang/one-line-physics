import { Random } from '../utils/Random';

export interface TileData {
    id: number;     // 唯一ID
    type: number;   // 方块类型(如图案/颜色)
    x: number;      // 网格X坐标 (0-7)
    y: number;      // 网格Y坐标 (0-7)
    z: number;      // 层级Z坐标 (层叠高度)
    isLocked?: boolean;
    isBlind?: boolean;
    isFrozen?: boolean;
    bombTimer?: number;
    isReserve?: boolean;
    renderX?: number;   // 计算后的最终屏幕X坐标
    renderY?: number;   // 计算后的最终屏幕Y坐标
}

export class LevelGenerator {
    // 生成时不再需要外部传入 typeCount，这里会根据 totalTiles 自动推算
    public static generate(seed: number, totalTiles: number): TileData[] {
        // 防御性编程：连连看消除游戏的所有方块总数必须是3的倍数，否则一定有无法消除的死局（也会导致最后一个方块变成空图）
        totalTiles = Math.floor(totalTiles / 3) * 3;

        const random = new Random(seed);
        const level = seed; // 将 seed 视作关卡数
        
        const tiles: TileData[] = [];
        const typePool: number[] = [];
        
        // 根据砖块总数推算需要的花色种类 (最多 18 种，因为材质包最多只有 18 个图案，超出会导致图案重复但无法消除)
        const typeCount = Math.min(Math.floor(totalTiles / 6), 18);

        // 1. 严格平均分配方块种类 (保证每种图案只有寥寥数个，拒绝无脑点击)
        const groups = Math.floor(totalTiles / 3);
        for (let i = 0; i < groups; i++) {
            // 使用取模运算保证绝对平均分布
            const type = (i % typeCount) + 1;
            typePool.push(type, type, type);
        }

        // 2. 打乱方块类型池
        const shuffledTypes = random.shuffle(typePool);

        // 定义多种不同的横向铺开、错落有致的连连看阵型模板
        let currentMainCapacity = 0;
        // 预留约 25% 的方块给盲盒区，剩下的 75% 用来铺设主阵型
        const targetMainCapacity = Math.floor(totalTiles * 0.75);
        
        const layers: {pattern: string[], offsetX: number, offsetY: number}[] = [];
        let layerZ = 0;

        // 定义 4 种基础阵型，必须使用 0.5 的偏移量来制造死角遮挡！
        const baseShapes = [
            // Shape 0: 大金字塔 (宽 8x8)
            // 每一层必须错开 0.5，这样上一层的 1 个方块能死死压住下一层的 4 个方块！
            [
                { pattern: ["00111100", "01111110", "11111111", "11111111", "11111111", "01111110", "00111100"], offsetX: 0, offsetY: 0 },
                { pattern: ["011110", "111111", "111111", "111111", "011110"], offsetX: 0.5, offsetY: 0.5 },
                { pattern: ["011110", "111111", "111111", "111111", "011110"], offsetX: 1.0, offsetY: 1.0 },
                { pattern: ["1111", "1111", "1111"], offsetX: 1.5, offsetY: 1.5 },
                { pattern: ["11", "11"], offsetX: 2.0, offsetY: 2.0 }
            ],
            // Shape 1: 镂空大十字 (宽 8x8)
            [
                { pattern: ["11000011", "11000011", "00111100", "00111100", "11000011", "11000011"], offsetX: 0, offsetY: 0 },
                { pattern: ["011110", "110011", "100001", "100001", "110011", "011110"], offsetX: 0.5, offsetY: 0.5 },
                { pattern: ["1111", "1001", "1001", "1111"], offsetX: 1.0, offsetY: 1.0 },
                { pattern: ["11", "00", "11"], offsetX: 1.5, offsetY: 1.5 }
            ],
            // Shape 2: 错落长城 (宽 8x8)
            [
                { pattern: ["11111111", "11111111", "11111111", "11111111"], offsetX: 0, offsetY: 1.0 },
                { pattern: ["1111111", "1111111", "1111111"], offsetX: 0.5, offsetY: 1.5 },
                { pattern: ["111111", "111111"], offsetX: 1.0, offsetY: 2.0 },
                { pattern: ["11111"], offsetX: 1.5, offsetY: 2.5 }
            ],
            // Shape 3: 棋盘重叠 (极其恶心，上下层互相咬合)
            [
                { pattern: ["1010101", "0101010", "1010101", "0101010", "1010101", "0101010", "1010101"], offsetX: 0, offsetY: 0 },
                { pattern: ["1010101", "0101010", "1010101", "0101010", "1010101", "0101010", "1010101"], offsetX: 0.5, offsetY: 0.5 },
                { pattern: ["1010101", "0101010", "1010101", "0101010", "1010101", "0101010", "1010101"], offsetX: 1.0, offsetY: 1.0 }
            ],
            // Shape 4: 菱形核心
            [
                { pattern: ["00011000", "00111100", "01111110", "11111111", "01111110", "00111100", "00011000"], offsetX: 0, offsetY: 0 },
                { pattern: ["001100", "011110", "111111", "011110", "001100"], offsetX: 0.5, offsetY: 0.5 },
                { pattern: ["0110", "1111", "0110"], offsetX: 1.0, offsetY: 1.0 },
                { pattern: ["11"], offsetX: 1.5, offsetY: 1.5 }
            ],
            // Shape 5: 四散星辰 (中心高，四角独立)
            [
                { pattern: ["11000011", "11000011", "00000000", "00011000", "00011000", "00000000", "11000011", "11000011"], offsetX: 0, offsetY: 0 },
                { pattern: ["01000010", "00000000", "00011000", "00011000", "00000000", "01000010"], offsetX: 0.5, offsetY: 0.5 },
                { pattern: ["000000", "001100", "001100", "000000"], offsetX: 1.0, offsetY: 1.0 }
            ]
        ];

        // 动态排版裂变：根据关卡决定基础阵型和旋转角度 (0: 0度, 1: 90度, 2: 180度, 3: 270度)
        // 6种阵型 * 4种旋转 = 24种绝对不同的基础结构！再配合无尽的方块数量和负面机制，构成无限关卡！
        const shapeType = (level - 1) % baseShapes.length;
        const rotation = Math.floor((level - 1) / baseShapes.length) % 4;
        
        const transformPattern = (pattern: string[], rot: number): string[] => {
            if (rot === 0) return pattern;
            let result = pattern;
            for (let i = 0; i < rot; i++) {
                const rows = result.length;
                const cols = result[0].length;
                const newPattern: string[] = [];
                for (let c = 0; c < cols; c++) {
                    let newRow = '';
                    for (let r = rows - 1; r >= 0; r--) {
                        newRow += result[r][c];
                    }
                    newPattern.push(newRow);
                }
                result = newPattern;
            }
            return result;
        };

        // 针对前两关的小型教学模板 (防止由于砖块总数太少导致一层都铺不满)
        const tutorialShapes = [
            // 第一关：十字星 (可爱且有层次，总共 18 张牌在主阵型，18 张在备用堆)
            [
                { pattern: ["0110", "1111", "1111", "0110"], offsetX: 0, offsetY: 0 },
                { pattern: ["11", "11"], offsetX: 1.0, offsetY: 1.0 },
                { pattern: ["11"], offsetX: 1.0, offsetY: 1.5 }
            ],
            // 第二关：大号双爱心 (精美且容量大，约 60 张在主阵型，完美消耗 72 张的总量)
            [
                { pattern: [
                    "01100110", 
                    "11111111", 
                    "11111111", 
                    "01111110", 
                    "00111100", 
                    "00011000"
                ], offsetX: 0, offsetY: 0 },
                { pattern: [
                    "0111110", 
                    "1111111", 
                    "0111110", 
                    "0011100", 
                    "0001000"
                ], offsetX: 0.5, offsetY: 0.5 },
                { pattern: [
                    "01110", 
                    "11111", 
                    "01110", 
                    "00100"
                ], offsetX: 1.0, offsetY: 1.0 },
                { pattern: [
                    "010", 
                    "101", 
                    "010"
                ], offsetX: 1.5, offsetY: 1.5 }
            ]
        ];

        let rawBaseShape;
        if (level === 1) {
            rawBaseShape = tutorialShapes[0];
        } else if (level === 2) {
            rawBaseShape = tutorialShapes[1];
        } else {
            rawBaseShape = baseShapes[shapeType];
        }

        // 动态翻转
        const baseShape = rawBaseShape.map(layer => {
            return {
                offsetX: layer.offsetX,
                offsetY: layer.offsetY,
                pattern: transformPattern(layer.pattern, rotation)
            };
        });

        let shapeIteration = 0;

        const isTutorial = level <= 2;

        while (true) {
            const layerDef = baseShape[shapeIteration % baseShape.length];
            
            // 计算该层容量
            let added = 0;
            for (const row of layerDef.pattern) {
                for (const char of row) {
                    if (char === '1') added++;
                }
            }

            layers.push(layerDef);
            currentMainCapacity += added;
            layerZ++;
            shapeIteration++;

            // 如果是非教学关卡，达到或超过目标容量则停止
            // 注意：这里放在 push 后面，允许它轻微超出 75% 目标，以尽量消耗更多砖块
            if (!isTutorial && currentMainCapacity >= targetMainCapacity) {
                break;
            }
            
            // 如果是教学关卡，强行铺满设计的层数后停止
            if (isTutorial && shapeIteration >= baseShape.length) {
                break;
            }
        }

        let tIndex = 0;
        let z = 0;
        for (const layer of layers) {
            // 计算当前层需要的方块容量
            let layerCapacity = 0;
            for (const row of layer.pattern) {
                for (const char of row) {
                    if (char === '1') layerCapacity++;
                }
            }

            // 只有当剩余方块足够填满这一整层时，才生成，保证绝对的居中和对称！
            if (totalTiles - tIndex < layerCapacity) {
                break;
            }
            
            for (let row = 0; row < layer.pattern.length; row++) {
                const rowStr = layer.pattern[row];
                for (let col = 0; col < rowStr.length; col++) {
                    if (rowStr[col] === '1') {
                        let isLocked = false;
                        let isFrozen = false;
                        let bombTimer = undefined;

                        // 难度曲线：第 3 关引入锁链，最高概率 15%
                        if (level >= 3) {
                            const lockProb = Math.min(0.15, 0.05 + (level - 3) * 0.03);
                            isLocked = random.next() < lockProb;
                        }
                        
                        // 难度曲线：第 4 关引入冰冻，最高概率 12%
                        if (level >= 4 && !isLocked) { 
                            const iceProb = Math.min(0.12, 0.05 + (level - 4) * 0.02);
                            isFrozen = random.next() < iceProb;
                        }
                        
                        // 难度曲线：第 5 关引入定时炸弹，固定概率 3%
                        if (level >= 5 && !isLocked && !isFrozen) {
                            if (random.next() < 0.03) {
                                // 倒数步数随关卡严苛，从 25 步缩减到极限 12 步
                                bombTimer = Math.max(12, 25 - (level - 5) * 2);
                            }
                        }
                        
                        tiles.push({
                            id: tIndex + 1,
                            type: shuffledTypes[tIndex],
                            x: layer.offsetX + col,
                            y: layer.offsetY + row,
                            z: z,
                            isLocked: isLocked,
                            isFrozen: isFrozen,
                            bombTimer: bombTimer
                        });
                        tIndex++;
                    }
                }
            }
            z++;
        }

        // 计算主棋盘的 X 轴中心点，以便盲盒预备堆始终完美居中对着主阵型
        let minX = Infinity;
        let maxX = -Infinity;
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].x < minX) minX = tiles[i].x;
            if (tiles[i].x > maxX) maxX = tiles[i].x;
        }
        const mainCenter = minX === Infinity ? 0 : (minX + maxX) / 2;

        // 4. 底层/盲盒预备堆的多样化布局 (围绕中心点绝对对称，数字代表相对于中心点的 X 偏移)
        const reserveLayouts = [
            // Layout 0: 双柱拉开
            [ -2.0, 2.0 ],
            // Layout 1: 一字排开 5列
            [ -2.0, -1.0, 0.0, 1.0, 2.0 ],
            // Layout 2: 三柱
            [ -2.0, 0.0, 2.0 ],
            // Layout 3: 八字外展四柱
            [ -2.5, -1.0, 1.0, 2.5 ] // 修改为更分散的四柱
        ];

        // 依据当前关卡 (seed) 选择底层盲盒阵型
        const remainingForReserve = totalTiles - tIndex;
        let currentReserve;
        
        if (level === 1) {
            // 第一关强制使用 4 柱阵型
            currentReserve = reserveLayouts[3];
        } else if (level === 2) {
            // 第二关强制使用 3 柱阵型
            currentReserve = reserveLayouts[2];
        } else {
            // 动态智能排版：如果主阵型因对称性限制没能铺满，导致剩下的盲牌过多
            // 必须强制拉宽阵型，防止叠成摩天大楼！
            if (remainingForReserve >= 30) {
                // 极多：7列大平铺
                currentReserve = [ -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0 ];
            } else if (remainingForReserve >= 15) {
                // 较多：5列排开
                currentReserve = reserveLayouts[1]; // [ -2.0, -1.0, 0.0, 1.0, 2.0 ]
            } else {
                // 数量正常，正常轮换
                currentReserve = reserveLayouts[(level - 1) % reserveLayouts.length];
            }
        }
        
        // 记录每个预备堆列的当前 Z 轴高度
        const reserveZs = new Array(currentReserve.length).fill(0);
        let rIndex = 0;

        while (tIndex < totalTiles) {
            const colIndex = rIndex % currentReserve.length;
            const xOffset = currentReserve[colIndex];
            
            // 第 2 关开始，底部预备堆变成盲牌
            const isBlind = level >= 2;
            
            tiles.push({
                id: tIndex + 1,
                type: shuffledTypes[tIndex],
                x: mainCenter + xOffset,
                y: 0, // y 会在 main.ts 中基于 maxY 动态计算
                z: reserveZs[colIndex]++,
                isBlind: isBlind,
                isReserve: true
            });
            tIndex++;
            rIndex++;
        }

        return tiles;
    }
}
