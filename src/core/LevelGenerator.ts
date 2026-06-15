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
        // 判断是否是每日擂台模式 (擂台模式的 seed 是一个类似 20260612 的大数字)
        const isDaily = seed > 100000;
        const level = isDaily ? 999 : seed; // 将 seed 视作主线关卡数

        const tiles: TileData[] = [];
        
        // 推算需要的花色种类 (最少 5 种，最多 18 种)
        let typeCount = 5;
        if (isDaily) {
            typeCount = 18; // 擂台模式全量花色
        } else {
            if (level === 1) typeCount = 5;
            else if (level === 2) typeCount = 6;
            else if (level === 3) typeCount = 7;
            else if (level === 4) typeCount = 8;
            else if (level === 5) typeCount = 9;
            else {
                // 每 10 关一个周期
                const cycle = Math.floor((level - 6) / 10);
                const step = (level - 6) % 10;
                // 随周期增长的底限，上限卡在 14，留出空间给周期内增长
                const baseTypes = Math.min(10 + Math.floor(cycle / 2), 14);
                typeCount = baseTypes + Math.floor(step / 2.0); 
                if (typeCount > 18) typeCount = 18;
            }
        }

        // 旧版的随机分配方式已废弃，现在由后面的绝对有解算法分配

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

                        // 难度曲线：第 10 关引入锁链，最高概率 15%
                        if (level >= 10 || isDaily) {
                            const effectiveLevel = isDaily ? 30 : level;
                            const lockProb = Math.min(0.15, 0.02 + (effectiveLevel - 10) * 0.005);
                            isLocked = random.next() < lockProb;
                        }
                        
                        // 难度曲线：第 20 关引入冰冻，最高概率 12%
                        if ((level >= 20 || isDaily) && !isLocked) { 
                            const effectiveLevel = isDaily ? 30 : level;
                            const iceProb = Math.min(0.12, 0.02 + (effectiveLevel - 20) * 0.005);
                            isFrozen = random.next() < iceProb;
                        }
                        
                        // 炸弹的生成逻辑被移到了最后（Solvable Generator 之后），以确保绝对有解
                        
                        tiles.push({
                            id: tIndex + 1,
                            type: 0, // Placeholder, will be assigned by Solvable Generator
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
                type: 0, // Placeholder
                x: mainCenter + xOffset,
                y: 0, // y 会在 main.ts 中基于 maxY 动态计算
                z: reserveZs[colIndex]++,
                isBlind: isBlind,
                isReserve: true
            });
            tIndex++;
            rIndex++;
        }

        // =========================================================
        // 5. 绝对有解算法 (Solvable Reverse-Play Generator)
        // =========================================================
        
        // 5.1 构造依赖图
        // 倒序游戏中：一个方块想要被"放回"棋盘，它下方的方块必须已经全部被放回。
        // 所以我们定义依赖关系：上方块 依赖于 下方块。
        const edges: { [id: number]: number[] } = {};
        const indegree: { [id: number]: number } = {};
        
        for (let i = 0; i < tiles.length; i++) {
            edges[i] = [];
            indegree[i] = 0;
        }

        // 预处理依赖关系：检查物理遮挡 (上方块挡住下方块)
        // 注意：由于备用区(盲牌)实际上是在主阵型下方，或者没有重叠，所以这里只看Z轴和物理坐标。
        // 在 main.ts 中判断遮挡的逻辑：z更大 或者 z相同y更大，且物理重叠 < 0.99
        for (let bottom = 0; bottom < tiles.length; bottom++) {
            const t1 = tiles[bottom];
            for (let top = 0; top < tiles.length; top++) {
                if (bottom === top) continue;
                const t2 = tiles[top];
                
                let isCovering = false;
                if (t2.z > t1.z || (t2.z === t1.z && t2.y > t1.y)) {
                    const dx = Math.abs(t2.x - t1.x);
                    const dy = Math.abs(t2.y - t1.y);
                    if (dx < 0.99 && dy < 0.99) {
                        isCovering = true;
                    }
                }

                if (isCovering) {
                    // t2 是上层，t1 是下层
                    // 逆向播放中：t2 的放置依赖于 t1 的放置
                    edges[bottom].push(top);
                    indegree[top]++;
                }
            }
        }

        // 5.2 初始化可用槽位 (入度为 0 的槽位代表下方悬空或底层，在逆向中可优先放置)
        const eligibleSlots: number[] = [];
        for (let i = 0; i < tiles.length; i++) {
            if (indegree[i] === 0) {
                eligibleSlots.push(i);
            }
        }

        // 5.3 准备花色三连包 (打乱)
        const triplets: number[] = [];
        const numTriplets = totalTiles / 3;
        for (let i = 0; i < numTriplets; i++) {
            triplets.push((i % typeCount) + 1);
        }
        const shuffledTriplets = random.shuffle(triplets);

        // 5.4 虚拟暂存槽 (逆向模拟)
        const virtualHold: number[] = [];

        // 5.5 逆向放置主循环
        let placedCount = 0;
        while (placedCount < totalTiles) {
            const canDoA = virtualHold.length <= 4 && shuffledTriplets.length > 0;
            const canDoB = virtualHold.length > 0 && eligibleSlots.length > 0;

            if (!canDoA && !canDoB) {
                // 理论上通过严格证明，这里绝对不会触发，因为这是一个DAG，且动作必然可达。
                throw new Error("Solvable generation deadlock.");
            }

            // 策略选择：如果暂存槽快满了，倾向于操作 B (放置到棋盘)；如果太空，倾向于操作 A (补充花色)
            let chooseA = false;
            if (canDoA && canDoB) {
                chooseA = random.next() < 0.5; // 50% 概率，产生合理的难度
            } else if (canDoA) {
                chooseA = true;
            }

            if (chooseA) {
                // Action A: 塞入 3 个相同花色到暂存区
                const type = shuffledTriplets.pop()!;
                virtualHold.push(type, type, type);
            } else {
                // Action B: 从暂存区随机取出一个，放到棋盘上
                // 1. 随机选一个可用槽位
                const slotIndex = Math.floor(random.next() * eligibleSlots.length);
                const tileIndex = eligibleSlots[slotIndex];
                eligibleSlots.splice(slotIndex, 1);

                // 2. 随机选一个暂存槽中的花色
                const holdIndex = Math.floor(random.next() * virtualHold.length);
                const assignedType = virtualHold[holdIndex];
                virtualHold.splice(holdIndex, 1);

                // 3. 赋值花色
                tiles[tileIndex].type = assignedType;
                placedCount++;

                // 4. 更新依赖图：该槽位已放，解除其上层遮挡物的依赖
                for (const topIndex of edges[tileIndex]) {
                    indegree[topIndex]--;
                    if (indegree[topIndex] === 0) {
                        eligibleSlots.push(topIndex);
                    }
                }
            }
        }

        // 5.6 新增：智能分配定时炸弹 (保证绝对可解)
        // 之前在前期随机分配炸弹会导致：炸弹在最上层，但另外两个同花色卡牌深埋在盲盒里，导致根本无法解开。
        // 现在我们在所有花色分配完毕后，挑选那些“三个卡牌都在可见区域（非盲盒）且整体深度较浅”的花色来赋予炸弹。
        if (level >= 30 || isDaily) {
            const effectiveLevel = isDaily ? 50 : level;
            // 统计每个花色的所有卡牌索引
            const typeToIndices: { [type: number]: number[] } = {};
            for (let i = 0; i < tiles.length; i++) {
                if (tiles[i].isLocked || tiles[i].isFrozen) continue; // 已经有特殊状态的跳过
                const type = tiles[i].type;
                if (!typeToIndices[type]) typeToIndices[type] = [];
                typeToIndices[type].push(i);
            }

            // 筛选合法的候选花色
            const validBombTypes: number[] = [];
            for (const typeStr in typeToIndices) {
                const indices = typeToIndices[typeStr];
                if (indices.length < 3) continue; 
                
                // 按 z 轴从高到低排序，优先考察最容易拿到的几个
                indices.sort((a, b) => tiles[b].z - tiles[a].z);
                const top3 = indices.slice(0, 3);
                
                // 1. 绝对不能在盲盒里
                const hasBlind = top3.some(idx => tiles[idx].isBlind);
                if (hasBlind) continue;
                
                // 2. 保证这最容易拿到的三个卡牌中，最深的一个不能太低
                const minZ = Math.min(...top3.map(idx => tiles[idx].z));
                const requiredZ = Math.max(0, Math.floor(layers.length / 2) - 1);
                if (minZ >= requiredZ) {
                    validBombTypes.push(Number(typeStr));
                }
            }

            // 决定生成几个炸弹
            const maxBombs = isDaily ? 3 : Math.min(3, Math.floor((level - 20) / 10));
            const bombCount = Math.min(maxBombs, validBombTypes.length);
            
            // 随机挑选几个花色，在其中最高的一个卡牌上放置炸弹
            const shuffledValidTypes = random.shuffle(validBombTypes);
            for (let i = 0; i < bombCount; i++) {
                const type = shuffledValidTypes[i];
                const indices = typeToIndices[type];
                
                // 按 z 轴从高到低排序，拿到最上面的 3 个
                indices.sort((a, b) => tiles[b].z - tiles[a].z);
                const currentTop3 = indices.slice(0, 3);
                
                // 从这最容易拿到的 3 个卡牌中，随机选一个放置炸弹
                // 这样炸弹有时会在最顶层，有时会在中层（被覆盖时不会倒数，直到被挖出来才会开始滴答）
                const targetIdx = currentTop3[Math.floor(random.next() * currentTop3.length)];
                
                // 放置炸弹，倒数步数适当放宽
                tiles[targetIdx].bombTimer = Math.max(16, 35 - Math.floor((effectiveLevel - 30) / 5));
            }
        }

        return tiles;
    }
}
