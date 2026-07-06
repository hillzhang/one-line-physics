import * as PIXI from 'pixi.js-legacy';
import { install } from '@pixi/unsafe-eval';

try {
    // @ts-ignore
    install(PIXI);
    // 强制双重覆盖，防止某些打包器缓存或冻结 prototype
    const shaderSys = (PIXI as any).ShaderSystem || (PIXI as any).systems?.ShaderSystem;
    if (shaderSys && shaderSys.prototype) {
        shaderSys.prototype.systemCheck = function () { };
    }
} catch (e) {
    console.error('[PIXI] Failed to install unsafe-eval patch:', e);
}
const CLOUD_STORAGE_BASE = 'https://7072-prod-d5gnecgcl8574e82a-1441836262.tcb.qcloud.la/';
import { LevelGenerator, TileData } from './core/LevelGenerator';
import { loadingArtBase64 } from './loadingArtBase64';

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Reusable logo logic
function createPremiumLogoContainer() {
    const titleContainer = new PIXI.Container();
    const chars = ['奇', '趣', '果', '宝', '消'];
    let currentX = -130;
    const charNodes: { node: PIXI.Container, baseX: number, baseY: number, baseRot: number, phase: number }[] = [];

    chars.forEach((char, i) => {
        const charContainer = new PIXI.Container();
        const shadowText = new PIXI.Text(char, { fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif', fontSize: 70, fontWeight: '900', fill: '#4E2914', stroke: '#4E2914', strokeThickness: 24, lineJoin: 'round' });
        shadowText.y = 6;
        const outlineText = new PIXI.Text(char, { fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif', fontSize: 70, fontWeight: '900', fill: '#4E2914', stroke: '#4E2914', strokeThickness: 24, lineJoin: 'round' });
        const whiteStroke = new PIXI.Text(char, { fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif', fontSize: 70, fontWeight: '900', fill: '#FFFFFF', stroke: '#FFFFFF', strokeThickness: 10, lineJoin: 'round' });
        const mainText = new PIXI.Text(char, { fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif', fontSize: 70, fontWeight: '900', fill: ['#FF5252', '#FF9800'], lineJoin: 'round' });

        [shadowText, outlineText, whiteStroke, mainText].forEach(t => { t.anchor.set(0.5); charContainer.addChild(t); });

        const baseX = currentX;
        const baseY = (i % 2 === 0) ? -6 : 6;
        const baseRot = (Math.random() - 0.5) * 0.2;
        charContainer.x = baseX; charContainer.y = baseY; charContainer.rotation = baseRot;
        titleContainer.addChild(charContainer);
        charNodes.push({ node: charContainer, baseX, baseY, baseRot, phase: i * 0.8 });
        currentX += 65;
    });

    const star1 = new PIXI.Text('⭐', { fontSize: 30 }); star1.position.set(110, -40); star1.anchor.set(0.5); titleContainer.addChild(star1);
    const star2 = new PIXI.Text('✨', { fontSize: 24 }); star2.position.set(-140, 15); star2.anchor.set(0.5); titleContainer.addChild(star2);
    const leaf1 = new PIXI.Text('🌸', { fontSize: 24 }); leaf1.position.set(-110, -35); leaf1.anchor.set(0.5); titleContainer.addChild(leaf1);

    const signContainer = new PIXI.Container(); signContainer.y = 65;
    const ropes = new PIXI.Graphics(); ropes.lineStyle(4, 0x4E2914); ropes.moveTo(-25, -25); ropes.lineTo(-15, 0); ropes.moveTo(25, -25); ropes.lineTo(15, 0); signContainer.addChild(ropes);
    const board = new PIXI.Graphics(); board.beginFill(0xCA9C7A); board.lineStyle(4, 0x4E2914); board.drawRoundedRect(-50, -15, 100, 30, 8); board.endFill();
    board.lineStyle(2, 0x8C5A35, 0.5); board.moveTo(-30, -4); board.lineTo(30, -4); board.moveTo(-40, 6); board.lineTo(20, 6); signContainer.addChild(board);
    const seasonText = new PIXI.Text('S1 赛季', { fontFamily: '"PingFang SC"', fontSize: 14, fill: '#FFFFFF', fontWeight: '900', stroke: '#4E2914', strokeThickness: 4 });
    seasonText.anchor.set(0.5); signContainer.addChild(seasonText);
    titleContainer.addChild(signContainer);

    return { titleContainer, charNodes, star1, star2, leaf1, signContainer };
}

function updatePremiumLogoAnimation(logoObjs: any, titleAnimTime: number, targetTitleScale: number) {
    const { titleContainer, charNodes, star1, star2, leaf1, signContainer } = logoObjs;
    charNodes.forEach((c: any) => {
        c.node.y = c.baseY + Math.sin(titleAnimTime + c.phase) * 5;
        c.node.rotation = c.baseRot + Math.cos(titleAnimTime * 0.8 + c.phase) * 0.04;
    });
    star1.rotation = 0.3 + Math.sin(titleAnimTime * 1.5) * 0.2; star1.scale.set(1 + Math.sin(titleAnimTime * 2) * 0.15);
    star2.rotation = Math.cos(titleAnimTime * 1.2) * 0.2; star2.scale.set(1 + Math.cos(titleAnimTime * 2.5) * 0.15);
    leaf1.rotation = -0.5 + Math.sin(titleAnimTime * 0.8) * 0.1;
    signContainer.rotation = Math.sin(titleAnimTime * 1.2) * 0.05; signContainer.y = 65 + Math.cos(titleAnimTime * 1.5) * 2;
    titleContainer.scale.set(targetTitleScale * (1 + Math.sin(titleAnimTime * 0.6) * 0.015));
}

function getOffsetDateInfo(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    let label = `${mm}-${dd}`;
    if (offset === 0) label = '今天';
    else if (offset === -1) label = '昨天';
    else if (offset === -2) label = '前天';

    return {
        key: `daily_score_${yyyy}-${mm}-${dd}`,
        label: label
    };
}

const sysInfo = wx.getSystemInfoSync();
const screenWidth = sysInfo.windowWidth;
const screenHeight = sysInfo.windowHeight;
const pixelRatio = sysInfo.pixelRatio || 1;

// 移除由于微信环境缺少标准 DOM API 而导致崩溃的插件
if (PIXI && PIXI.Renderer && (PIXI.Renderer as any).__plugins) {
    delete (PIXI.Renderer as any).__plugins.accessibility;
}

// 强制 PixiJS 仅请求 WebGL 1，彻底避开微信 WAGame SDK 对 webgl2 的致命崩溃 Bug
PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL_LEGACY;

const app = new PIXI.Application({
    view: GameGlobal.canvas as any,
    width: screenWidth,
    height: screenHeight,
    resolution: pixelRatio,
    autoDensity: true,
    backgroundColor: 0x87CEEB,
    forceCanvas: false // 开启 WebGL 1，因为 game.js 已经打补丁完美绕过了 WebGL 2 崩溃
});

// ================= 0.5. 音频管理 =================
let bgmAudio: any = null;

let webAudioCtx: any = null;
let clearAudioBuffer: any = null;
let clickAudioBuffer: any = null;

if (typeof wx !== 'undefined') {
    if (wx.createInnerAudioContext) {
        bgmAudio = wx.createInnerAudioContext();
        bgmAudio.src = `${CLOUD_STORAGE_BASE}assets/bgm_new.mp3`;
        bgmAudio.loop = true;
        bgmAudio.volume = 0.5;

        // 监听微信前后台切换，控制音乐启停
        wx.onShow(() => {
            if (bgmAudio && !bgmAudio.paused && playerData?.settings?.bgm) bgmAudio.play();
        });
        wx.onHide(() => {
            if (bgmAudio) bgmAudio.pause();
        });
    }

    if (wx.createWebAudioContext) {
        webAudioCtx = wx.createWebAudioContext();
        const fs = wx.getFileSystemManager();

        wx.downloadFile({
            url: `${CLOUD_STORAGE_BASE}assets/clear.wav`,
            success: (dlRes: any) => {
                if (dlRes.statusCode === 200) {
                    fs.readFile({
                        filePath: dlRes.tempFilePath,
                        success: (res: any) => {
                            webAudioCtx.decodeAudioData(res.data, (buffer: any) => clearAudioBuffer = buffer, (err: any) => console.error(err));
                        }
                    });
                }
            }
        });

        wx.downloadFile({
            url: `${CLOUD_STORAGE_BASE}assets/click.wav`,
            success: (dlRes: any) => {
                if (dlRes.statusCode === 200) {
                    fs.readFile({
                        filePath: dlRes.tempFilePath,
                        success: (res: any) => {
                            webAudioCtx.decodeAudioData(res.data, (buffer: any) => clickAudioBuffer = buffer, (err: any) => console.error(err));
                        }
                    });
                }
            }
        });
    }
}

function playSFX(buffer: any, volume: number) {
    if (!webAudioCtx || !buffer || playerData?.settings?.sfx === false) return;
    const source = webAudioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = webAudioCtx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(webAudioCtx.destination);
    source.start(0);
}

function playClearSFX() {
    playSFX(clearAudioBuffer, 0.8);
}

function playClickSFX() {
    playSFX(clickAudioBuffer, 0.5);
}

function playBGM() {
    if (bgmAudio && playerData?.settings?.bgm !== false) bgmAudio.play();
}

function stopBGM() {
    if (bgmAudio) bgmAudio.pause();
}

// @ts-ignore
const stage = app.stage;

// ================= 终极事件接管 =================
// 彻底抛弃 DOM 垫片，直接读取微信原生 Touch 并手动派发给 Pixi 对象
if (typeof wx !== 'undefined' && wx.onTouchStart) {
    const interaction = app.renderer.plugins.interaction;

    const emitBubbling = (target: any, eventName: string, mockEvent: any) => {
        let current = target;
        while (current) {
            current.emit(eventName, mockEvent);
            current = current.parent;
        }
    };

    wx.onTouchStart((res: any) => {
        if (!interaction || !res.changedTouches || !res.changedTouches.length) return;
        const touch = res.changedTouches[0];
        const hitPoint = new PIXI.Point(touch.clientX, touch.clientY);
        const hitTarget = interaction.hitTest(hitPoint, app.stage);
        if (hitTarget) {
            const mockEvent = { data: { global: hitPoint } };
            emitBubbling(hitTarget, 'pointerdown', mockEvent);
            emitBubbling(hitTarget, 'touchstart', mockEvent);
        }
    });

    wx.onTouchMove((res: any) => {
        if (!interaction || !res.changedTouches || !res.changedTouches.length) return;
        const touch = res.changedTouches[0];
        const hitPoint = new PIXI.Point(touch.clientX, touch.clientY);
        const hitTarget = interaction.hitTest(hitPoint, app.stage);
        if (hitTarget) {
            const mockEvent = { data: { global: hitPoint } };
            emitBubbling(hitTarget, 'pointermove', mockEvent);
            emitBubbling(hitTarget, 'touchmove', mockEvent);
        }
    });

    wx.onTouchEnd((res: any) => {
        if (!interaction || !res.changedTouches || !res.changedTouches.length) return;
        const touch = res.changedTouches[0];
        const hitPoint = new PIXI.Point(touch.clientX, touch.clientY);
        const hitTarget = interaction.hitTest(hitPoint, app.stage);
        if (hitTarget) {
            const mockEvent = { data: { global: hitPoint } };
            emitBubbling(hitTarget, 'pointerup', mockEvent);
            emitBubbling(hitTarget, 'touchend', mockEvent);
            emitBubbling(hitTarget, 'pointerupoutside', mockEvent);
        }
    });
}

// ===============================================



const TILE_SIZE = Math.floor(screenWidth / 10.5); // 确保 10 列宽度的阵型也能安全放下
const TILE_MARGIN = 2; // 增加间距，让方块不要粘连
const TILE_STEP_X = TILE_SIZE + TILE_MARGIN;
const TILE_STEP_Y = TILE_SIZE + 4 + TILE_MARGIN; // Y轴步长必须大于 TILE_SIZE，防止下一行盖住上一行的 3D 厚度
const LAYER_OFFSET_X = 0;
const LAYER_OFFSET_Y = -4; // 适当往上偏移产生立体层叠高度，避免缝隙过大产生悬空感

// 基础网格起始 Y
const GRID_START_Y = screenHeight * 0.28;



// ================= 玩家数据与商城配置 =================
interface PlayerData {
    coins: number;
    unlocked: { tiles: string[]; emojis: string[]; bgs: string[]; vfx: string[]; };
    equipped: { tile: string; emoji: string; bg: string; vfx: string; };
    props: { undo: number; extract: number; shuffle: number; };
    level: number;
    checkInDate: string; // "YYYY-MM-DD"
    gameClubDate: string; // "YYYY-MM-DD"
    checkInStreak: number;
    adDate?: string;
    adCount?: number;
    shareDate?: string;
    shareCount?: number;
    settings: { bgm: boolean; sfx: boolean; vibration: boolean; };
    unlockedItems: string[];
    lastUpdated: number;
}
let playerData: PlayerData = {
    coins: 200, // 初始送一些金币
    unlocked: { tiles: ['default'], emojis: ['default'], bgs: ['auto'], vfx: ['default'] },
    equipped: { tile: 'default', emoji: 'default', bg: 'auto', vfx: 'default' },
    props: { undo: 3, extract: 2, shuffle: 2 },
    level: 1,
    checkInDate: '',
    gameClubDate: '',
    checkInStreak: 0,
    adDate: '',
    adCount: 0,
    settings: { bgm: true, sfx: true, vibration: true },
    unlockedItems: [],
    lastUpdated: 0
};

try {
    let saved;
    if (typeof wx !== 'undefined') {
        saved = wx.getStorageSync('playerData');
    } else if (typeof localStorage !== 'undefined') {
        saved = localStorage.getItem('playerData');
    }
    if (saved) {
        playerData = JSON.parse(saved);
        if (!playerData.props) playerData.props = { undo: 3, extract: 3, shuffle: 3 };
        if (!playerData.level) playerData.level = 1;
        if (playerData.checkInDate === undefined) playerData.checkInDate = '';
        if (playerData.checkInStreak === undefined) playerData.checkInStreak = 0;
        if (!playerData.settings) playerData.settings = { bgm: true, sfx: true, vibration: true };
        if (!playerData.unlockedItems) playerData.unlockedItems = [];
        if (!playerData.gameClubDate) playerData.gameClubDate = '';
        if (!playerData.lastUpdated) playerData.lastUpdated = 0;
        if (!playerData.unlocked.bgs.includes('bg6')) playerData.unlocked.bgs.push('bg6');
        if (!playerData.unlocked.bgs.includes('bg7')) playerData.unlocked.bgs.push('bg7');
    }
} catch (e) { }

if (typeof wx !== 'undefined' && wx.cloud) {
    // 开启微信右上角分享和转发功能
    if (wx.showShareMenu) {
        wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    }
    if (wx.onShareAppMessage) {
        wx.onShareAppMessage(() => ({
            title: '奇趣果宝消太好玩了，快来和我一起挑战最强关卡！'
        }));
    }

    wx.cloud.init({ env: 'prod-d5gnecgcl8574e82a', traceUser: true });

    // 异步拉取云端存档
    wx.cloud.callContainer({
        config: { env: 'prod-d5gnecgcl8574e82a' },
        path: '/api/user/data',
        header: { 'X-WX-SERVICE': 'golang-backend' },
        method: 'GET',
        success: (res: any) => {
            if (res.statusCode === 200 && res.data) {
                const cloudData = res.data;
                const cloudTime = cloudData.lastUpdated || 0;
                const localTime = playerData.lastUpdated || 0;
                const cloudIsNewer = cloudTime > localTime;

                // 如果云端的更新时间较新，或者云端关卡大于本地，或者本地全新，则覆盖本地
                if (cloudIsNewer || cloudData.level > playerData.level || (playerData.level === 1 && cloudData.level > 0)) {
                    playerData.level = cloudData.level || 1;
                    playerData.coins = cloudData.coins || 0;
                    if (cloudTime > 0) playerData.lastUpdated = cloudTime;

                    if (cloudData.unlocked && cloudData.unlocked.trim() !== '') {
                        try {
                            const unl = JSON.parse(cloudData.unlocked);
                            playerData.unlocked = { ...playerData.unlocked, ...unl };
                        } catch (e) { }
                    }
                    if (cloudData.props && cloudData.props.trim() !== '') {
                        try { playerData.props = { ...playerData.props, ...JSON.parse(cloudData.props) }; } catch (e) { }
                    }
                    if (cloudData.equipped && cloudData.equipped.trim() !== '') {
                        try { playerData.equipped = { ...playerData.equipped, ...JSON.parse(cloudData.equipped) }; } catch (e) { }
                    }
                    if (cloudData.settings && cloudData.settings.trim() !== '') {
                        try { playerData.settings = { ...playerData.settings, ...JSON.parse(cloudData.settings) }; } catch (e) { }
                    }
                    if (cloudData.checkInDate) playerData.checkInDate = cloudData.checkInDate;
                    if (cloudData.checkInStreak !== undefined) playerData.checkInStreak = cloudData.checkInStreak;
                    if (cloudData.adDate) playerData.adDate = cloudData.adDate;
                    if (cloudData.adCount !== undefined) playerData.adCount = cloudData.adCount;
                    if (cloudData.gameClubDate) playerData.gameClubDate = cloudData.gameClubDate;

                    // 保存到本地并更新UI
                    try { wx.setStorageSync('playerData', JSON.stringify(playerData)); } catch (e) { }
                    if (coinTextObj) coinTextObj.text = playerData.coins.toString();
                    console.log('已从云端同步最新存档');
                }
            }
        }
    });
}

let coinTextObj: PIXI.Text;
let btnUndoGlobal: any;
let btnExtractGlobal: any;
let btnShuffleGlobal: any;
let currentGameMode: 'main' | 'daily' = 'main';
let lastGlobalBtnClickTime = 0;

// 计时器相关状态
let gameStartTime: number = 0;
let gameTimerInterval: any = null;
let gameTimeSeconds: number = 0;
let dailyTimerText: PIXI.Text | null = null;

let lastAdWatchTime: number = 0;
const AD_COOLDOWN_MS = 60 * 1000; // 1分钟冷却限制

const checkAndWatchAd = (onSuccess: () => void) => {
    const now = Date.now();
    const timeSinceLastAd = now - lastAdWatchTime;
    if (timeSinceLastAd < AD_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((AD_COOLDOWN_MS - timeSinceLastAd) / 1000);
        if (typeof wx !== 'undefined') {
            wx.showToast({ title: `请休息一下，${secondsLeft}秒后再试`, icon: 'none' });
        }
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (playerData.adDate !== today) {
        playerData.adDate = today;
        playerData.adCount = 0;
    }

    if (playerData.adCount! >= 5) {
        if (typeof wx !== 'undefined') {
            wx.showModal({
                title: '次数已达上限',
                content: '今日免费免广告奖励次数已用尽，请明日再来！',
                showCancel: false
            });
        }
        return;
    }

    if (typeof wx !== 'undefined') {
        wx.showModal({
            title: '提示',
            content: '广告功能正在完善中，直接为您发放奖励！',
            showCancel: false,
            success: () => {
                playerData.adCount!++;
                lastAdWatchTime = Date.now();
                onSuccess();
            }
        });
    } else {
        // web testing fallback
        playerData.adCount!++;
        lastAdWatchTime = Date.now();
        onSuccess();
    }
};

const savePlayerData = (mode: 'main' | 'daily' = 'main', scoreValue?: number) => {
    playerData.lastUpdated = Date.now();
    try {
        const dataStr = JSON.stringify(playerData);
        if (typeof wx !== 'undefined') wx.setStorageSync('playerData', dataStr);
        else if (typeof localStorage !== 'undefined') localStorage.setItem('playerData', dataStr);
    } catch (e) { }
    if (coinTextObj) coinTextObj.text = playerData.coins.toString();

    if (typeof wx !== 'undefined' && wx.setUserCloudStorage) {
        // 微信开放数据域存储（好友排行榜）
        wx.setUserCloudStorage({
            KVDataList: [{ key: 'score', value: playerData.level.toString() }]
        });
    }

    if (typeof wx !== 'undefined' && wx.cloud) {
        // 同步给 Golang 后端（全服排行与存档备份）
        wx.cloud.callContainer({
            config: { env: 'prod-d5gnecgcl8574e82a' },
            path: '/api/user/sync',
            header: {
                'X-WX-SERVICE': 'golang-backend',
                'content-type': 'application/json'
            },
            method: 'POST',
            data: {
                coins: playerData.coins,
                level: playerData.level,
                unlocked: JSON.stringify(playerData.unlocked),
                props: JSON.stringify(playerData.props),
                equipped: JSON.stringify(playerData.equipped),
                settings: JSON.stringify(playerData.settings),
                checkInDate: playerData.checkInDate,
                checkInStreak: playerData.checkInStreak,
                adDate: playerData.adDate,
                adCount: playerData.adCount,
                gameClubDate: playerData.gameClubDate
            },
            success: (res: any) => {
                if (res.statusCode !== 200) {
                    console.error('云端同步返回错误:', res.data.error || '未知错误');
                }
            },
            fail: (err: any) => console.error('云端同步失败:', err)
        });

        // 获取或让玩家输入昵称
        let nickname = '';
        try {
            nickname = wx.getStorageSync('playerNickname');
        } catch (e) { }

        if (!nickname || nickname.startsWith('玩家_')) {
            const adjs = ['快乐的', '调皮的', '聪明的', '勇敢的', '懒惰的', '迷人的', '神秘的', '幸运的', '憨厚的', '机智的', '可爱的', '酷酷的', '贪吃的', '无敌的', '呆萌的', '佛系的', '高冷的', '傲娇的', '热血的', '安静的', '疯狂的', '无聊的', '勤奋的', '胖胖的', '圆圆的', '软萌的', '优雅的', '暴躁的', '戏精', '吃货', '野生', '摸鱼的', '秃头的', '打工的', '文艺的'];
            const nouns = ['小猫', '小狗', '狮子', '熊猫', '兔子', '狐狸', '考拉', '猴子', '老虎', '企鹅', '大象', '海豚', '仓鼠', '水豚', '海豹', '柴犬', '橘猫', '柯基', '二哈', '萨摩耶', '羊驼', '水獭', '浣熊', '土拨鼠', '修勾', '猫咪', '小熊', '锦鲤', '海鸥', '松鼠', '树懒', '刺猬', '恐龙', '独角兽', '咸鱼'];
            const randomNum = Math.floor(Math.random() * 900) + 100; // 100~999
            nickname = adjs[Math.floor(Math.random() * adjs.length)] + nouns[Math.floor(Math.random() * nouns.length)] + randomNum;
            try {
                wx.setStorageSync('playerNickname', nickname);
                wx.setStorageSync('isNicknameAutoGenerated', true);
            } catch (e) { }
        }

        let finalScore = playerData.level;
        if (mode === 'daily' && scoreValue !== undefined) {
            finalScore = scoreValue;
        }

        let finalMode = mode === 'daily' ? `daily_${getTodayString()}` : mode;
        submitToGlobalLeaderboard(nickname, finalMode, finalScore);
    }
}

const submitToGlobalLeaderboard = (name: string, mode: string = 'main', score: number = 0) => {
    wx.cloud.callContainer({
        config: { env: 'prod-d5gnecgcl8574e82a' },
        path: '/api/leaderboard/submit',
        header: {
            'X-WX-SERVICE': 'golang-backend',
            'content-type': 'application/json'
        },
        method: 'POST',
        data: {
            nickname: name,
            avatarUrl: '', // 不使用头像或使用默认空头像
            score: score,
            mode: mode
        },
        success: (res: any) => {
            if (res.statusCode !== 200) {
                console.error('提交全服排行榜错误:', res.data.error || '未知错误');
            }
        },
        fail: (err: any) => console.error('提交全服排行榜失败:', err)
    });
};

const fruitBase = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_fruits.png');
fruitBase.setSize(512, 512);
const catBase = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_cats.png');
catBase.setSize(512, 512);
const dessertBase = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_desserts.png');
dessertBase.setSize(512, 512);

const fruitBase2 = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_fruits_2.png');
fruitBase2.setSize(512, 512);
const catBase2 = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_cats_2.png');
catBase2.setSize(512, 512);
const dessertBase2 = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_desserts_2.png');
dessertBase2.setSize(512, 512);

const oceanBase = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_ocean.png');
oceanBase.setSize(512, 512);
const oceanBase2 = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_ocean_2.png');
oceanBase2.setSize(512, 512);

const carBase = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_cars.png');
carBase.setSize(512, 512);
const carBase2 = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_cars_2.png');
carBase2.setSize(512, 512);

const animalBase = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_animals.png');
animalBase.setSize(512, 512);
const animalBase2 = PIXI.BaseTexture.from(CLOUD_STORAGE_BASE + 'assets/sprite_animals_2.png');
animalBase2.setSize(512, 512);

function extractGridTextures(baseTex: PIXI.BaseTexture): PIXI.Texture[] {
    const textures: PIXI.Texture[] = [];
    const size = 170.5;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            // 切割时向内收缩 7.5 像素，防止切掉图案边缘
            const margin = 7.5;
            const frame = new PIXI.Rectangle(col * size + margin, row * size + margin, size - margin * 2, size - margin * 2);
            textures.push(new PIXI.Texture(baseTex, frame));
        }
    }
    return textures;
}

const fruitTextures = [...extractGridTextures(fruitBase), ...extractGridTextures(fruitBase2)];
const catTextures = [...extractGridTextures(catBase), ...extractGridTextures(catBase2)];
const dessertTextures = [...extractGridTextures(dessertBase), ...extractGridTextures(dessertBase2)];
const oceanTextures = [...extractGridTextures(oceanBase), ...extractGridTextures(oceanBase2)];
const carTextures = [...extractGridTextures(carBase), ...extractGridTextures(carBase2)];
const animalTextures = [...extractGridTextures(animalBase), ...extractGridTextures(animalBase2)];
const SHOP_ITEMS = {
    tiles: [
        { id: 'default', name: '经典奶白', price: 0, color: 0xFFFDF8, base: 0xD7CCC8 },
        { id: 'mahjong', name: '国粹麻将', price: 200, color: 0xFFFFFF, base: 0x4CAF50 },
        { id: 'jelly', name: '半透果冻', price: 300, color: 0xB3E5FC, alpha: 0.85, base: 0x03A9F4 },
        { id: 'wood', name: '原木雕刻', price: 300, color: 0xA1887F, base: 0x5D4037 },
        { id: 'metal', name: '未来机甲', price: 400, color: 0xE0E0E0, base: 0x607D8B },
        { id: 'biscuit', name: '香甜饼干', price: 400, color: 0xFFE082, base: 0x8D6E63 }
    ],
    emojis: [
        { id: 'default', name: '缤纷鲜果', price: 0, textures: fruitTextures },
        { id: 'cats', name: '喵星人集会', price: 200, textures: catTextures },
        { id: 'dessert', name: '甜点派对', price: 200, textures: dessertTextures },
        { id: 'ocean', name: '海洋世界', price: 200, textures: oceanTextures },
        { id: 'cars', name: '玩具赛车', price: 200, textures: carTextures },
        { id: 'animals', name: '动物森林', price: 200, textures: animalTextures }
    ],
    bgs: [
        { id: 'auto', name: '关卡自动轮换', price: 0 },
        { id: 'bg6', name: '护眼静绿(免费)', price: 0 },
        { id: 'bg7', name: '清爽浅蓝(免费)', price: 0 },
        { id: 'bg1', name: '永久清新草地', price: 100 },
        { id: 'bg2', name: '永久阳光沙滩', price: 100 },
        { id: 'bg3', name: '永久秋日森林', price: 100 },
        { id: 'bg4', name: '永久魔法星空', price: 100 },
        { id: 'bg5', name: '永久凛冬雪山', price: 100 }
    ],
    vfx: [
        { id: 'default', name: '经典白烟', price: 0 },
        { id: 'star', name: '星光爆碎', price: 400 },
        { id: 'bubble', name: '梦幻气泡', price: 500 },
        { id: 'confetti', name: '彩带欢呼', price: 500 },
        { id: 'heart', name: '粉红爱心', price: 500 },
        { id: 'music', name: '欢乐音符', price: 600 }
    ],
    props: [
        { id: 'undo', name: '撤回道具 x3', price: 100, isConsumable: true },
        { id: 'extract', name: '移出道具 x3', price: 150, isConsumable: true },
        { id: 'shuffle', name: '洗牌道具 x3', price: 120, isConsumable: true },
        { id: 'bundle', name: '超值大礼包', price: 300, isConsumable: true, desc: '包含：撤回x3、移出x3、洗牌x3' }
    ],
    coins: [
        { id: 'ad', name: '观看视频广告', price: 0, isVideo: true },
        { id: 'share', name: '分享给好友', price: 0, isShare: true }
    ]
} as any;

// ================= 背景 =================
const homeBgTexture = PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/bg.png');
const themeTextures = [
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg.png'),        // 清新草地
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg_beach.png'),  // 阳光沙滩
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg_autumn.png'), // 秋日森林
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg_night.png'),  // 魔法星空
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg_snow.png'),   // 凛冬雪山
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg_solid_green.png'), // 护眼静绿
    PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/game_board_bg_solid_blue.png')   // 清爽浅蓝
];
const bgSprite = new PIXI.Sprite(homeBgTexture);
const scale = Math.max(screenWidth / 1024, screenHeight / 1024);
bgSprite.scale.set(scale);
bgSprite.x = screenWidth / 2;
bgSprite.y = screenHeight / 2;
bgSprite.anchor.set(0.5);
app.stage.addChild(bgSprite);

// ================= 更新全局背景 =================
function updateGlobalBackground(isGameActive = false, level = 1) {
    if (!isGameActive) {
        // 首页和商城界面，始终保持固定的主题背景
        bgSprite.texture = homeBgTexture;
        playBGM(); // 播放首页背景音乐
        return;
    }
    stopBGM(); // 进入游戏暂停首页音乐

    // 进入游戏后，才会应用玩家在商城里装备的皮肤
    const equippedBg = SHOP_ITEMS.bgs.find((b: any) => b.id === playerData.equipped.bg) || SHOP_ITEMS.bgs[0];
    if (equippedBg.id === 'auto') {
        let index = 0;
        if (level > 0) {
            index = (level - 1) % themeTextures.length;
        } else {
            // 每日擂台：根据当天日期生成背景
            const d = new Date();
            const dateSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
            index = dateSeed % themeTextures.length;
        }
        bgSprite.texture = themeTextures[index];
    } else {
        const bgIndex = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'bg6', 'bg7'].indexOf(equippedBg.id);
        if (bgIndex !== -1) bgSprite.texture = themeTextures[bgIndex];
    }
}

// ================= 场景容器 =================
const homeContainer = new PIXI.Container();
const gameContainer = new PIXI.Container();
const shopContainer = new PIXI.Container();
const helpContainer = new PIXI.Container();
const settingsContainer = new PIXI.Container();
const rankContainer = new PIXI.Container();

const checkInContainer = new PIXI.Container();
const gameClubContainer = new PIXI.Container();

// 半透明商城背景 (This overlay is static, but shop re-renders it dynamically, we leave this one as is or remove it. But better to keep it to avoid errors)
const shopOverlay = new PIXI.Graphics();
shopOverlay.beginFill(0x000000, 0.8);
shopOverlay.drawRect(0, 0, screenWidth, screenHeight);
shopOverlay.endFill();
shopOverlay.interactive = true;
shopContainer.addChild(shopOverlay);

// 半透明帮助背景
const helpOverlay = new PIXI.Graphics();
helpOverlay.beginFill(0x000000, 0.8);
helpOverlay.drawRect(0, 0, screenWidth, screenHeight);
helpOverlay.endFill();
helpOverlay.interactive = true;
helpOverlay.on('pointerdown', () => {
    helpContainer.visible = false;
    homeContainer.visible = true;
});
helpContainer.addChild(helpOverlay);

// 半透明设置背景
const settingsOverlay = new PIXI.Graphics();
settingsOverlay.beginFill(0x000000, 0.8);
settingsOverlay.drawRect(0, 0, screenWidth, screenHeight);
settingsOverlay.endFill();
settingsOverlay.interactive = true;
settingsOverlay.on('pointerdown', () => {
    settingsContainer.visible = false;
    homeContainer.visible = true;
});
settingsContainer.addChild(settingsOverlay);

// 半透明排行背景
const rankOverlay = new PIXI.Graphics();
rankOverlay.beginFill(0x000000, 0.8);
rankOverlay.drawRect(0, 0, screenWidth, screenHeight);
rankOverlay.endFill();
rankOverlay.interactive = true;
rankOverlay.on('pointerdown', () => {
    rankContainer.visible = false;
    homeContainer.visible = true;
    if (typeof wx !== 'undefined' && wx.getOpenDataContext) {
        wx.getOpenDataContext().postMessage({ type: 'hideLeaderboard' });
    }
});
rankContainer.addChild(rankOverlay);

let sharedTexture: PIXI.Texture | null = null;
if (typeof wx !== 'undefined' && wx.getOpenDataContext) {
    const openDataContext = wx.getOpenDataContext();
    const sharedCanvas = openDataContext.canvas;
    const pixelRatio = sysInfo.pixelRatio || 2;
    sharedCanvas.width = screenWidth * 0.9 * pixelRatio;
    sharedCanvas.height = screenHeight * 0.6 * pixelRatio;

    sharedTexture = PIXI.Texture.from(sharedCanvas as any);
    const sharedSprite = new PIXI.Sprite(sharedTexture);
    sharedSprite.width = screenWidth * 0.9;
    sharedSprite.height = screenHeight * 0.6;

    const rankTopY = sysInfo.safeArea ? Math.max(sysInfo.safeArea.top + 50, 90) : 90;
    sharedSprite.position.set(screenWidth * 0.05, rankTopY + 110);
    sharedSprite.interactive = true; // 拦截点击排行榜区域
    rankContainer.addChild(sharedSprite);
}

const rankTopY = sysInfo.safeArea ? Math.max(sysInfo.safeArea.top + 50, 90) : 90;

// 排行榜控制状态
let currentRankScope: 'friend' | 'global' = 'friend';
let currentRankMode: 'main' | 'daily' = 'main';

const rankTabsContainer = new PIXI.Container();
rankTabsContainer.position.set(screenWidth / 2, rankTopY);
rankTabsContainer.interactive = true; // 拦截点击

// === 第一层：范围选择 (微信好友 vs 全服玩家) ===
const scopeSegmentContainer = new PIXI.Container();
scopeSegmentContainer.position.set(0, 0);

const scopeBg = new PIXI.Graphics();
scopeBg.beginFill(0x000000, 0.4);
scopeBg.drawRoundedRect(-130, -20, 260, 40, 20);
scopeBg.endFill();

const scopeSlider = new PIXI.Graphics();
scopeSegmentContainer.addChild(scopeBg, scopeSlider);

const scopeFriendTab = new PIXI.Container();
scopeFriendTab.position.set(-65, 0);
const scopeFriendText = new PIXI.Text('👥 微信好友', { fontFamily: '"PingFang SC"', fontSize: 16, fill: '#FFFFFF', fontWeight: 'bold' });
scopeFriendText.anchor.set(0.5);
scopeFriendTab.addChild(scopeFriendText);
scopeFriendTab.interactive = true;
scopeFriendTab.buttonMode = true;

const scopeGlobalTab = new PIXI.Container();
scopeGlobalTab.position.set(65, 0);
const scopeGlobalText = new PIXI.Text('🌍 全服玩家', { fontFamily: '"PingFang SC"', fontSize: 16, fill: '#FFFFFF', fontWeight: 'bold' });
scopeGlobalText.anchor.set(0.5);
scopeGlobalTab.addChild(scopeGlobalText);
scopeGlobalTab.interactive = true;
scopeGlobalTab.buttonMode = true;

scopeSegmentContainer.addChild(scopeFriendTab, scopeGlobalTab);

// === 第二层：模式选择 (主线闯关 vs 每日擂台) ===
const modeSegmentContainer = new PIXI.Container();
modeSegmentContainer.position.set(0, 50);

const modeBg = new PIXI.Graphics();
modeBg.beginFill(0x000000, 0.4);
modeBg.drawRoundedRect(-100, -16, 200, 32, 16);
modeBg.endFill();

const modeSlider = new PIXI.Graphics();
modeSegmentContainer.addChild(modeBg, modeSlider);

const modeMainTab = new PIXI.Container();
modeMainTab.position.set(-50, 0);
const modeMainText = new PIXI.Text('🌟 主线闯关', { fontFamily: '"PingFang SC"', fontSize: 14, fill: '#FFFFFF', fontWeight: 'bold' });
modeMainText.anchor.set(0.5);
modeMainTab.addChild(modeMainText);
modeMainTab.interactive = true;
modeMainTab.buttonMode = true;

const modeDailyTab = new PIXI.Container();
modeDailyTab.position.set(50, 0);
const modeDailyText = new PIXI.Text('🔥 每日擂台', { fontFamily: '"PingFang SC"', fontSize: 14, fill: '#FFFFFF', fontWeight: 'bold' });
modeDailyText.anchor.set(0.5);
modeDailyTab.addChild(modeDailyText);
modeDailyTab.interactive = true;
modeDailyTab.buttonMode = true;

modeSegmentContainer.addChild(modeMainTab, modeDailyTab);

rankTabsContainer.addChild(scopeSegmentContainer, modeSegmentContainer);
rankContainer.addChild(rankTabsContainer);

let sharedSpriteRef: PIXI.Sprite | null = null;
let hasPromptedNickname = false;
rankContainer.children.forEach(c => {
    if (c instanceof PIXI.Sprite && c.texture && c.texture.baseTexture) {
        sharedSpriteRef = c;
    }
});

const updateRankUI = () => {
    // 更新第一层滑块
    scopeSlider.clear();
    if (currentRankScope === 'friend') {
        scopeSlider.beginFill(0x3B82F6, 0.9);
        scopeSlider.drawRoundedRect(-126, -16, 126, 32, 16);
    } else {
        scopeSlider.beginFill(0x10B981, 0.9);
        scopeSlider.drawRoundedRect(0, -16, 126, 32, 16);
    }
    scopeSlider.endFill();

    // 更新第二层滑块
    modeSlider.clear();
    if (currentRankMode === 'main') {
        modeSlider.beginFill(0xF59E0B, 0.9);
        modeSlider.drawRoundedRect(-96, -12, 96, 24, 12);
    } else {
        modeSlider.beginFill(0x8B5CF6, 0.9);
        modeSlider.drawRoundedRect(0, -12, 96, 24, 12);
    }
    modeSlider.endFill();

    if (currentRankScope === 'global') {
        if (sharedSpriteRef) sharedSpriteRef.visible = false;
        globalRankListContainer.visible = true;

        if (currentRankMode === 'daily') {
            dateSelectorContainer.visible = true;
            dailyRankOffset = 0;
            updateDateSelector();
        } else {
            dateSelectorContainer.visible = false;
            fetchAndRenderGlobalRank('main');
        }

        if (!hasPromptedNickname) {
            let nickname = '';
            let isAutoGenerated = false;
            try {
                nickname = wx.getStorageSync('playerNickname');
                isAutoGenerated = wx.getStorageSync('isNicknameAutoGenerated') === true;
            } catch (e) { }
            if (!nickname || nickname.startsWith('玩家_') || isAutoGenerated) {
                hasPromptedNickname = true;
                wx.showModal({
                    title: '初次见面 👋',
                    content: '',
                    editable: true,
                    placeholderText: '起个响亮的名字...',
                    success: (res) => {
                        if (res.confirm && res.content) {
                            const newName = res.content.substring(0, 12);
                            wx.setStorageSync('playerNickname', newName);
                            wx.setStorageSync('isNicknameAutoGenerated', false);
                            savePlayerData(); // 保存并上报
                            setTimeout(() => {
                                if (currentRankMode === 'main') {
                                    fetchAndRenderGlobalRank('main');
                                } else {
                                    updateDateSelector();
                                }
                            }, 500);
                        }
                    }
                });
            }
        }
    } else {
        if (sharedSpriteRef) sharedSpriteRef.visible = true;
        globalRankListContainer.visible = false;
        if (typeof wx !== 'undefined' && typeof wx.getOpenDataContext === 'function') {
            if (currentRankMode === 'main') {
                dateSelectorContainer.visible = false;
                wx.getOpenDataContext().postMessage({
                    type: 'showLeaderboard',
                    scoreKey: 'score',
                    formatType: 'level',
                    title: '🏆 微信好友 · 主线榜'
                });
            } else {
                dateSelectorContainer.visible = true;
                dailyRankOffset = 0;
                updateDateSelector();
            }
        }
    }
};

scopeFriendTab.on('pointerdown', () => { currentRankScope = 'friend'; updateRankUI(); });
scopeFriendTab.on('touchstart', () => { currentRankScope = 'friend'; updateRankUI(); });
scopeGlobalTab.on('pointerdown', () => { currentRankScope = 'global'; updateRankUI(); });
scopeGlobalTab.on('touchstart', () => { currentRankScope = 'global'; updateRankUI(); });

modeMainTab.on('pointerdown', () => { currentRankMode = 'main'; updateRankUI(); });
modeMainTab.on('touchstart', () => { currentRankMode = 'main'; updateRankUI(); });
modeDailyTab.on('pointerdown', () => { currentRankMode = 'daily'; updateRankUI(); });
modeDailyTab.on('touchstart', () => { currentRankMode = 'daily'; updateRankUI(); });

let dailyRankOffset = 0;
const dateSelectorContainer = new PIXI.Container();
dateSelectorContainer.position.set(screenWidth / 2, rankTopY + 110);

const prevBtn = new PIXI.Container();
prevBtn.position.set(-80, 0);
const prevBtnText = new PIXI.Text('<', { fontFamily: '"PingFang SC"', fontSize: 20, fill: '#FFFFFF', fontWeight: 'bold' });
prevBtnText.anchor.set(0.5);
prevBtn.addChild(prevBtnText);
prevBtn.interactive = true;
prevBtn.buttonMode = true;

const nextBtn = new PIXI.Container();
nextBtn.position.set(80, 0);
const nextBtnText = new PIXI.Text('>', { fontFamily: '"PingFang SC"', fontSize: 20, fill: '#FFFFFF', fontWeight: 'bold' });
nextBtnText.anchor.set(0.5);
nextBtn.addChild(nextBtnText);
nextBtn.interactive = true;
nextBtn.buttonMode = true;

const dateLabelBtn = new PIXI.Container();
const dateLabelBg = new PIXI.Graphics();
dateLabelBg.beginFill(0xFFFFFF, 0.2);
dateLabelBg.drawRoundedRect(-40, -15, 80, 30, 10);
dateLabelBg.endFill();
const dateLabelText = new PIXI.Text('今天', { fontFamily: '"PingFang SC"', fontSize: 16, fill: '#FFFFFF', fontWeight: 'bold' });
dateLabelText.anchor.set(0.5);
dateLabelBtn.addChild(dateLabelBg, dateLabelText);
dateLabelBtn.interactive = true;
dateLabelBtn.buttonMode = true;

dateSelectorContainer.addChild(prevBtn, dateLabelBtn, nextBtn);
rankContainer.addChild(dateSelectorContainer);
dateSelectorContainer.visible = false;

// --- 日期直选网格面板 ---
const datePickerContainer = new PIXI.Container();
datePickerContainer.visible = false;

const datePickerOverlay = new PIXI.Graphics();
datePickerOverlay.beginFill(0x000000, 0.7);
datePickerOverlay.drawRect(0, 0, screenWidth, screenHeight);
datePickerOverlay.endFill();
datePickerOverlay.interactive = true;
datePickerOverlay.on('pointerdown', () => { datePickerContainer.visible = false; });
datePickerContainer.addChild(datePickerOverlay);

const dpPanel = new PIXI.Container();
dpPanel.position.set(screenWidth / 2, screenHeight / 2);
dpPanel.interactive = true; // 拦截点击
const dpBg = new PIXI.Graphics();
dpBg.beginFill(0x1F2937);
dpBg.lineStyle(2, 0x8B5CF6);
dpBg.drawRoundedRect(-160, -200, 320, 400, 16);
dpBg.endFill();
dpPanel.addChild(dpBg);

const dpTitle = new PIXI.Text('选择历史日期', { fontFamily: '"PingFang SC"', fontSize: 20, fill: '#FFFFFF', fontWeight: 'bold' });
dpTitle.anchor.set(0.5);
dpTitle.position.set(0, -170);
dpPanel.addChild(dpTitle);

const dpGrid = new PIXI.Container();
dpGrid.position.set(-135, -120);

for (let i = 0; i < 30; i++) {
    const offset = -i;
    const info = getOffsetDateInfo(offset);
    const col = i % 5;
    const row = Math.floor(i / 5);

    const cell = new PIXI.Container();
    cell.position.set(col * 55 + 25, row * 50 + 15);

    const cellBg = new PIXI.Graphics();
    cellBg.beginFill(0x374151);
    cellBg.drawRoundedRect(-25, -15, 50, 30, 8);
    cellBg.endFill();

    const cellText = new PIXI.Text(info.label, { fontFamily: '"PingFang SC"', fontSize: 12, fill: '#FFFFFF' });
    cellText.anchor.set(0.5);

    cell.addChild(cellBg, cellText);
    cell.interactive = true;
    cell.buttonMode = true;
    cell.on('pointerdown', () => {
        dailyRankOffset = offset;
        updateDateSelector();
        datePickerContainer.visible = false;
    });

    dpGrid.addChild(cell);
}

dpPanel.addChild(dpGrid);
datePickerContainer.addChild(dpPanel);
rankContainer.addChild(datePickerContainer);

dateLabelBtn.on('pointerdown', () => { datePickerContainer.visible = true; });

const updateDateSelector = () => {
    const info = getOffsetDateInfo(dailyRankOffset);
    dateLabelText.text = info.label;
    nextBtn.alpha = dailyRankOffset >= 0 ? 0.3 : 1.0;
    prevBtn.alpha = dailyRankOffset <= -29 ? 0.3 : 1.0;

    if (currentRankScope === 'global') {
        fetchAndRenderGlobalRank(info.key.replace('daily_score_', 'daily_'));
    } else {
        if (typeof wx !== 'undefined' && typeof wx.getOpenDataContext === 'function') {
            wx.getOpenDataContext().postMessage({
                type: 'showLeaderboard',
                scoreKey: info.key,
                formatType: 'time',
                title: `🏆 ${info.label}排行榜` // 动态更新标题
            });
        }
    }
};

prevBtn.on('pointerdown', () => { if (dailyRankOffset > -29) { dailyRankOffset--; updateDateSelector(); } });

nextBtn.on('pointerdown', () => { if (dailyRankOffset < 0) { dailyRankOffset++; updateDateSelector(); } });

// 排行榜关闭按钮
const closeRankBtn = new PIXI.Container();
closeRankBtn.position.set(screenWidth / 2, screenHeight * 0.88);

const crBg = new PIXI.Graphics();
crBg.beginFill(0x81C784); // Green
crBg.lineStyle(2, 0xFFFFFF, 0.8);
crBg.drawRoundedRect(-60, -20, 120, 40, 20);
crBg.endFill();

const crText = new PIXI.Text('关闭', {
    fontFamily: '"PingFang SC"', fontSize: 16, fill: '#FFFFFF', fontWeight: 'bold'
});
crText.anchor.set(0.5);

closeRankBtn.addChild(crBg, crText);
closeRankBtn.interactive = true;
closeRankBtn.buttonMode = true;
const closeRank = () => {
    rankContainer.visible = false;
    homeContainer.visible = true;
    if (typeof wx !== 'undefined' && wx.getOpenDataContext) {
        wx.getOpenDataContext().postMessage({ type: 'hideLeaderboard' });
    }
};
closeRankBtn.on('pointerdown', closeRank);
closeRankBtn.on('touchstart', closeRank);
rankContainer.addChild(closeRankBtn);

// 移除原来的全服排行榜独立弹窗逻辑，将其融入现有的排行榜中
const globalRankListContainer = new PIXI.Container();
globalRankListContainer.position.set(screenWidth * 0.1, rankTopY + 110);
globalRankListContainer.visible = false; // 初始隐藏

const listAreaHeight = Math.max(100, (screenHeight * 0.85) - (rankTopY + 110));

// 添加透明可交互背景拦截点击，防止穿透到 rankOverlay，并支持拖拽滑动
const globalRankBg = new PIXI.Graphics();
globalRankBg.beginFill(0x000000, 0.001); // 极低透明度，肉眼不可见
globalRankBg.drawRect(0, 0, screenWidth * 0.8, listAreaHeight);
globalRankBg.endFill();
globalRankBg.interactive = true; 
globalRankListContainer.addChild(globalRankBg);

// 添加滑动区域遮罩
const globalRankMask = new PIXI.Graphics();
globalRankMask.beginFill(0xFFFFFF);
globalRankMask.drawRect(0, 0, screenWidth * 0.8, listAreaHeight);
globalRankMask.endFill();
globalRankListContainer.addChild(globalRankMask);
globalRankListContainer.mask = globalRankMask;

// 内容容器
const globalRankScrollContent = new PIXI.Container();
globalRankListContainer.addChild(globalRankScrollContent);

// 强制设置容器交互和 hitArea，保证绝对能拦截点击，不会穿透到 rankOverlay
globalRankListContainer.interactive = true;
globalRankListContainer.hitArea = new PIXI.Rectangle(0, 0, screenWidth * 0.8, listAreaHeight);

// 拖拽滑动逻辑
let grDragging = false;
let grLastY = 0;

globalRankListContainer.on('pointerdown', (e: any) => {
    grDragging = true;
    grLastY = e.data.global.y;
    if (e.stopPropagation) e.stopPropagation();
});

// 绑定到全局 app.stage，防止滑动过快脱离区域导致事件丢失
    app.stage.on('pointermove', (e: any) => {
        if (grDragging && globalRankListContainer.visible) {
            let currentY = e.data.global.y;
            let deltaY = currentY - grLastY;
            
            let contentHeight = 0;
            if (globalRankScrollContent.children.length > 0) {
                const lastChild = globalRankScrollContent.children[globalRankScrollContent.children.length - 1];
                contentHeight = lastChild.y + 45; // 45 是行高
            }
            let maxScrollY = Math.max(0, contentHeight - listAreaHeight);
            
            // 越界时增加阻力
            if (globalRankScrollContent.y > 0 || globalRankScrollContent.y < -maxScrollY) {
                deltaY *= 0.3;
            }
            
            globalRankScrollContent.y += deltaY;
            grLastY = currentY;
        }
    });
    
    const endDrag = () => {
        if (!grDragging) return;
        grDragging = false;
        
        let contentHeight = 0;
        if (globalRankScrollContent.children.length > 0) {
            const lastChild = globalRankScrollContent.children[globalRankScrollContent.children.length - 1];
            contentHeight = lastChild.y + 45;
        }
        let maxScrollY = Math.max(0, contentHeight - listAreaHeight);
        let targetY = globalRankScrollContent.y;
    if (targetY > 0) targetY = 0;
    if (targetY < -maxScrollY) targetY = -maxScrollY;
    
    const bounce = () => {
        if (grDragging) return;
        const diff = targetY - globalRankScrollContent.y;
        if (Math.abs(diff) > 0.5) {
            globalRankScrollContent.y += diff * 0.2;
            requestAnimationFrame(bounce);
        } else {
            globalRankScrollContent.y = targetY;
        }
    };
    bounce();
};

app.stage.on('pointerup', endDrag);
app.stage.on('pointerupoutside', endDrag);

rankContainer.addChild(globalRankListContainer);

function fetchAndRenderGlobalRank(mode: string) {
    globalRankScrollContent.removeChildren();
    globalRankScrollContent.y = 0; // 重置滚动
    const loadingText = new PIXI.Text('加载中...', { fill: '#FFFFFF', fontSize: 16 });
    globalRankScrollContent.addChild(loadingText);

    if (typeof wx !== 'undefined' && wx.cloud) {
        wx.cloud.callContainer({
            config: { env: 'prod-d5gnecgcl8574e82a' },
            path: `/api/leaderboard/top?mode=${mode}`,
            header: { 'X-WX-SERVICE': 'golang-backend' },
            method: 'GET',
            success: (res: any) => {
                globalRankScrollContent.removeChildren();
                if (res.statusCode === 200 && Array.isArray(res.data)) {
                    const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'];
                    const getAvatarForName = (name: string) => {
                        let hash = 0;
                        for (let i = 0; i < name.length; i++) {
                            hash = name.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        return EMOJIS[Math.abs(hash) % EMOJIS.length];
                    };

                    res.data.forEach((player: any, index: number) => {
                        const row = new PIXI.Container();
                        const startY = mode.startsWith('daily') ? 40 : 0;
                        row.y = index * 45 + startY;

                        const rowBg = new PIXI.Graphics();
                        rowBg.beginFill(index % 2 === 0 ? 0x374151 : 0x1F2937, 0.8);
                        rowBg.drawRoundedRect(0, 0, screenWidth * 0.8, 40, 10);
                        rowBg.endFill();
                        row.addChild(rowBg);

                        const rankText = new PIXI.Text(`${index + 1}`, { fill: index < 3 ? '#FCD34D' : '#9CA3AF', fontSize: 18, fontWeight: 'bold' });
                        rankText.anchor.set(0.5);
                        rankText.position.set(20, 20);

                        const avatar = getAvatarForName(player.nickname || '匿名玩家');
                        const avatarText = new PIXI.Text(avatar, { fontSize: 22 });
                        avatarText.anchor.set(0.5);
                        avatarText.position.set(60, 20);

                        let displayNickname = player.nickname || '匿名玩家';
                        if (displayNickname.length > 8) {
                            displayNickname = displayNickname.substring(0, 8) + '...';
                        }

                        const nameText = new PIXI.Text(displayNickname, { fill: '#FFFFFF', fontSize: 16 });
                        nameText.anchor.set(0, 0.5);
                        nameText.position.set(85, 20);

                        let scoreDisplay = `${player.score} 关`;
                        if (mode.startsWith('daily')) {
                            let totalSeconds = player.score;
                            let min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
                            let sec = (totalSeconds % 60).toString().padStart(2, '0');
                            scoreDisplay = `${min}:${sec}`;
                        }
                        const scoreText = new PIXI.Text(scoreDisplay, { fill: mode === 'daily' ? '#F59E0B' : '#10B981', fontSize: 16, fontWeight: 'bold' });
                        scoreText.anchor.set(1, 0.5);
                        scoreText.position.set(screenWidth * 0.8 - 15, 20);

                        row.addChild(rankText, avatarText, nameText, scoreText);
                        globalRankScrollContent.addChild(row);
                    });
                } else {
                    const errText = new PIXI.Text('加载失败', { fill: '#EF4444', fontSize: 16 });
                    globalRankListContainer.addChild(errText);
                }
            },
            fail: () => {
                globalRankListContainer.removeChildren();
                const errText = new PIXI.Text('网络错误', { fill: '#EF4444', fontSize: 16 });
                globalRankListContainer.addChild(errText);
            }
        });
    } else {
        globalRankListContainer.removeChildren();
        const errText = new PIXI.Text('全服排行仅在微信环境可用', { fill: '#EF4444', fontSize: 16 });
        globalRankListContainer.addChild(errText);
    }
}

app.stage.addChild(homeContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(shopContainer);
app.stage.addChild(helpContainer);
app.stage.addChild(settingsContainer);
app.stage.addChild(rankContainer);

app.stage.addChild(checkInContainer);
app.stage.addChild(gameClubContainer);

homeContainer.visible = true;
gameContainer.visible = false;
shopContainer.visible = false;
helpContainer.visible = false;
settingsContainer.visible = false;
rankContainer.visible = false;
checkInContainer.visible = false;
gameClubContainer.visible = false;

// ================= 0.5. 每日签到 (Daily Check-in) =================
const checkInOverlay = new PIXI.Graphics();
checkInOverlay.beginFill(0x000000, 0.8);
checkInOverlay.drawRect(0, 0, screenWidth, screenHeight);
checkInOverlay.endFill();
checkInOverlay.interactive = true;
checkInOverlay.on('pointerdown', () => { checkInContainer.visible = false; });
checkInContainer.addChild(checkInOverlay);

const checkInPanel = new PIXI.Container();
checkInPanel.position.set(screenWidth / 2, screenHeight / 2);
checkInPanel.interactive = true; // 拦截点击
checkInContainer.addChild(checkInPanel);

const checkInBg = new PIXI.Graphics();
checkInBg.beginFill(0xFFFAF0);
checkInBg.lineStyle(4, 0xF59E0B);
checkInBg.drawRoundedRect(-160, -220, 320, 440, 20);
checkInBg.endFill();
checkInPanel.addChild(checkInBg);

const checkInTitle = new PIXI.Text('每日签到', { fontFamily: '"PingFang SC"', fontSize: 24, fill: '#D97706', fontWeight: 'bold' });
checkInTitle.anchor.set(0.5);
checkInTitle.position.set(0, -180);
checkInPanel.addChild(checkInTitle);

const checkInCloseBtn = new PIXI.Container();
checkInCloseBtn.position.set(160, -220);
const ciCloseBg = new PIXI.Graphics();
ciCloseBg.beginFill(0xEF4444);
ciCloseBg.drawCircle(0, 0, 16);
ciCloseBg.endFill();
const ciCloseText = new PIXI.Text('×', { fontFamily: 'Arial', fontSize: 20, fill: '#FFFFFF', fontWeight: 'bold' });
ciCloseText.anchor.set(0.5);
checkInCloseBtn.addChild(ciCloseBg, ciCloseText);
checkInCloseBtn.interactive = true;
checkInCloseBtn.buttonMode = true;
checkInCloseBtn.on('pointerdown', () => {
    checkInContainer.visible = false;
});
checkInPanel.addChild(checkInCloseBtn);

const checkInRewards = [50, 100, 150, 200, 250, 300, 500];
const checkInCards: PIXI.Container[] = [];
let btnClaimCheckIn: PIXI.Container;
let txtClaimCheckIn: PIXI.Text;

for (let i = 0; i < 7; i++) {
    const card = new PIXI.Container();
    // 4列 + 3列 布局
    const row = i < 4 ? 0 : 1;
    const col = i < 4 ? i : i - 4;
    const startX = row === 0 ? -105 : -70;
    const spacingX = 70;
    card.position.set(startX + col * spacingX, -100 + row * 90);

    const cBg = new PIXI.Graphics();
    // 初始状态稍后在 updateCheckInUI 中刷新
    cBg.beginFill(0xFDE68A);
    cBg.drawRoundedRect(-30, -35, 60, 70, 10);
    cBg.endFill();

    const dText = new PIXI.Text(`第${i + 1}天`, { fontFamily: '"PingFang SC"', fontSize: 12, fill: '#92400E' });
    dText.anchor.set(0.5);
    dText.position.set(0, -20);

    const icon = new PIXI.Text('🪙', { fontSize: 20 });
    icon.anchor.set(0.5);
    icon.position.set(0, 0);

    const amt = new PIXI.Text(`+${checkInRewards[i]}`, { fontFamily: '"PingFang SC"', fontSize: 14, fill: '#D97706', fontWeight: 'bold' });
    amt.anchor.set(0.5);
    amt.position.set(0, 20);

    card.addChild(cBg, dText, icon, amt);
    checkInCards.push(card);
    checkInPanel.addChild(card);
}

// 领取按钮
btnClaimCheckIn = new PIXI.Container();
btnClaimCheckIn.position.set(0, 150);
const claimBg = new PIXI.Graphics();
claimBg.beginFill(0x10B981);
claimBg.drawRoundedRect(-70, -25, 140, 50, 25);
claimBg.endFill();
txtClaimCheckIn = new PIXI.Text('点击签到', { fontFamily: '"PingFang SC"', fontSize: 18, fill: '#FFFFFF', fontWeight: 'bold' });
txtClaimCheckIn.anchor.set(0.5);
btnClaimCheckIn.addChild(claimBg, txtClaimCheckIn);
btnClaimCheckIn.interactive = true;
btnClaimCheckIn.buttonMode = true;
checkInPanel.addChild(btnClaimCheckIn);

let canCheckInToday = false;
let currentStreak = 0;

const updateCheckInUI = () => {
    const today = getOffsetDateInfo(0).key.replace('daily_score_', '');
    const yesterday = getOffsetDateInfo(-1).key.replace('daily_score_', '');

    if (playerData.checkInDate === today) {
        canCheckInToday = false;
        currentStreak = playerData.checkInStreak;
    } else if (playerData.checkInDate === yesterday) {
        canCheckInToday = true;
        currentStreak = playerData.checkInStreak % 7;
    } else {
        canCheckInToday = true;
        currentStreak = 0;
    }

    checkInCards.forEach((card, i) => {
        const bg = card.children[0] as PIXI.Graphics;
        bg.clear();

        if (i < currentStreak) {
            // 已经领取过
            bg.beginFill(0xD1D5DB); // 灰色
            bg.drawRoundedRect(-30, -35, 60, 70, 10);
            bg.endFill();
            card.alpha = 0.6;
        } else if (i === currentStreak && canCheckInToday) {
            // 今天可领取
            bg.beginFill(0x10B981); // 绿色高亮
            bg.drawRoundedRect(-30, -35, 60, 70, 10);
            bg.endFill();
            card.alpha = 1.0;
        } else {
            // 还没到
            bg.beginFill(0xFDE68A); // 默认黄
            bg.drawRoundedRect(-30, -35, 60, 70, 10);
            bg.endFill();
            card.alpha = 1.0;
        }
    });

    if (!canCheckInToday) {
        claimBg.clear();
        claimBg.beginFill(0x9CA3AF);
        claimBg.drawRoundedRect(-70, -25, 140, 50, 25);
        claimBg.endFill();
        txtClaimCheckIn.text = '今日已签到';
        btnClaimCheckIn.interactive = false;
        btnClaimCheckIn.buttonMode = false;
    } else {
        claimBg.clear();
        claimBg.beginFill(0x10B981);
        claimBg.drawRoundedRect(-70, -25, 140, 50, 25);
        claimBg.endFill();
        txtClaimCheckIn.text = '点击签到';
        btnClaimCheckIn.interactive = true;
        btnClaimCheckIn.buttonMode = true;
    }
};

btnClaimCheckIn.on('pointerdown', () => {
    if (!canCheckInToday) return;

    const reward = checkInRewards[currentStreak];
    playerData.coins += reward;
    playerData.checkInStreak = currentStreak + 1;
    playerData.checkInDate = getOffsetDateInfo(0).key.replace('daily_score_', '');
    try { wx.setStorageSync('playerData', JSON.stringify(playerData)); } catch (e) { }
    if (coinTextObj) coinTextObj.text = playerData.coins.toString();
    wx.showToast({ title: `签到成功，金币+${reward}`, icon: 'none' });

    updateCheckInUI();
});

const openCheckInScreen = () => {
    updateCheckInUI();
    checkInContainer.visible = true;
};

// ================= 0.6. 游戏圈 (Game Circle) =================
const gameClubOverlay = new PIXI.Graphics();
gameClubOverlay.beginFill(0x000000, 0.8);
gameClubOverlay.drawRect(0, 0, screenWidth, screenHeight);
gameClubOverlay.endFill();
gameClubOverlay.interactive = true;
gameClubOverlay.on('pointerdown', () => { gameClubContainer.visible = false; });
gameClubContainer.addChild(gameClubOverlay);

const gameClubPanel = new PIXI.Container();
gameClubPanel.position.set(screenWidth / 2, screenHeight / 2);
gameClubPanel.interactive = true; // 拦截点击
gameClubContainer.addChild(gameClubPanel);

// 外层边框
const gcBg = new PIXI.Graphics();
gcBg.beginFill(0xFFFAF0);
gcBg.lineStyle(4, 0xF59E0B);
gcBg.drawRoundedRect(-160, -200, 320, 400, 20);
gcBg.endFill();
gameClubPanel.addChild(gcBg);

// 标题牌
const gcTitleText = new PIXI.Text('圈子好礼', { fontFamily: '"PingFang SC"', fontSize: 24, fill: '#D97706', fontWeight: 'bold' });
gcTitleText.anchor.set(0.5);
gcTitleText.position.set(0, -160);
gameClubPanel.addChild(gcTitleText);

// 中心大图标
const gcIconText = new PIXI.Text('💬', { fontSize: 80 });
gcIconText.anchor.set(0.5);
gcIconText.position.set(0, -60);
gameClubPanel.addChild(gcIconText);
// 添加呼吸动画
let gcTime = 0;
app.ticker.add((delta) => {
    if (gameClubContainer.visible) {
        gcTime += delta * 0.05;
        gcIconText.y = -60 + Math.sin(gcTime) * 5;
    }
});

// 说明文字
const gcDesc = new PIXI.Text('加入游戏圈，并产生有效互动\n(发帖/点赞/评论)\n领取 50 金币奖励', {
    fontFamily: '"PingFang SC"', fontSize: 16, fill: '#92400E', align: 'center', lineHeight: 26, fontWeight: 'bold'
});
gcDesc.anchor.set(0.5);
gcDesc.y = 35;
gameClubPanel.addChild(gcDesc);

// 关闭按钮
const gcCloseBtn = new PIXI.Container();
gcCloseBtn.position.set(160, -200);
const gcCloseBg = new PIXI.Graphics();
gcCloseBg.beginFill(0xEF4444);
gcCloseBg.drawCircle(0, 0, 16);
gcCloseBg.endFill();
const gcCloseX = new PIXI.Text('×', { fontFamily: 'Arial', fontSize: 20, fill: '#FFFFFF', fontWeight: 'bold' });
gcCloseX.anchor.set(0.5);
gcCloseBtn.addChild(gcCloseBg, gcCloseX);
gcCloseBtn.interactive = true;
gcCloseBtn.buttonMode = true;
gcCloseBtn.on('pointerdown', () => {
    gameClubContainer.visible = false;
});
gameClubPanel.addChild(gcCloseBtn);

// 底部加入按钮
const btnJoinGc = new PIXI.Container();
btnJoinGc.position.set(0, 115);
const gcJoinBg = new PIXI.Graphics();
gcJoinBg.beginFill(0x3B82F6);
gcJoinBg.drawRoundedRect(-70, -25, 140, 50, 25);
gcJoinBg.endFill();
const gcJoinTxt = new PIXI.Text('加 入', { fontFamily: '"PingFang SC"', fontSize: 18, fill: '#FFFFFF', fontWeight: 'bold' });
gcJoinTxt.anchor.set(0.5);
btnJoinGc.addChild(gcJoinBg, gcJoinTxt);
btnJoinGc.interactive = true;
btnJoinGc.buttonMode = true;
gameClubPanel.addChild(btnJoinGc);

// 前往游戏圈链接文本
const gcLinkTxt = new PIXI.Text('前往游戏圈 >', { fontFamily: '"PingFang SC"', fontSize: 14, fill: '#3B82F6' });
gcLinkTxt.anchor.set(0.5);
gcLinkTxt.position.set(0, 165);
gcLinkTxt.interactive = true;
gcLinkTxt.buttonMode = true;
gameClubPanel.addChild(gcLinkTxt);

let gameCirclePageManager: any = null;
let pendingGameClubReward: (() => void) | null = null;

// 监听从游戏圈或后台返回时，发放积压的奖励
if (typeof wx !== 'undefined' && wx.onShow) {
    wx.onShow(() => {
        if (pendingGameClubReward) {
            setTimeout(() => {
                if (pendingGameClubReward) pendingGameClubReward();
                pendingGameClubReward = null;
            }, 500); // 稍微延迟一下，体验更好
        }
    });
}

const openGameClubFeature = (onSuccess?: () => void) => {
    if (typeof wx !== 'undefined') {
        if (wx.createPageManager) {
            const openlink = '-SSEykJvFV3pORt5kTNpS9Vql7BfqGfEBffsdkin54TRdWJUtpmtKsclGBBv1pgh8bSTVLd38SXwxzdbqhjEwuOL6w7FbM3wvZCAWz-QLHNzdgrR1KFO4QzsR17cPvZKMhG8LCVucMuST6Bx1gaajz6C7cj3AWC34zpRM3K775-utHf36Mw-95-tLf6CDmStpDqtugeA7FhBA2d9nsUbkI6AltDramvRK4slDqfd1Pnlq3MQE6bjvDMsCGz2Ui0JfzTHwEqzZrF7vEKAq-yD8gwhqfCmSb54M6XeLTY1e6hGjJTkNMFaCcncgEwm_K29ZFNHcBXpG_V7kFz3CfOmeA';
            if (!gameCirclePageManager) {
                gameCirclePageManager = wx.createPageManager();
            }
            gameCirclePageManager.load({ openlink }).then(() => {
                gameCirclePageManager.show();
                // 成功拉起后，将发奖逻辑挂载到“从后台返回”的回调中
                if (onSuccess) pendingGameClubReward = onSuccess;
            }).catch((err: any) => {
                console.error('游戏圈失败', err);
                wx.showToast({ title: '打开游戏圈失败', icon: 'none' });
            });
        } else {
            wx.showToast({ title: '请在微信真机上体验游戏圈', icon: 'none' });
        }
    } else {
        // 非微信环境直接发奖
        if (onSuccess) onSuccess();
    }
};

btnJoinGc.on('pointerdown', () => {
    const today = getOffsetDateInfo(0).key.replace('daily_score_', '');
    const hasRewardToday = playerData.gameClubDate === today;

    if (!hasRewardToday) {
        // 先拉起游戏圈，成功后再发奖励
        openGameClubFeature(() => {
            playerData.coins += 50;
            playerData.gameClubDate = today;
            savePlayerData();
            if (coinTextObj) coinTextObj.text = playerData.coins.toString();
            wx.showToast({ title: '获得 50 金币！', icon: 'none' });

            // 刷新按钮状态
            gcJoinBg.clear();
            gcJoinBg.beginFill(0x9CA3AF);
            gcJoinBg.drawRoundedRect(-70, -25, 140, 50, 25);
            gcJoinBg.endFill();
            gcJoinTxt.text = '已领取';
            btnJoinGc.interactive = false;
            btnJoinGc.buttonMode = false;
        });
    }
});

gcLinkTxt.on('pointerdown', () => {
    openGameClubFeature();
});

const openGameClubScreen = () => {
    const today = getOffsetDateInfo(0).key.replace('daily_score_', '');
    const hasRewardToday = playerData.gameClubDate === today;

    gcJoinBg.clear();
    if (hasRewardToday) {
        gcJoinBg.beginFill(0x9CA3AF);
        gcJoinBg.drawRoundedRect(-70, -25, 140, 50, 25);
        gcJoinBg.endFill();
        gcJoinTxt.text = '已领取';
        btnJoinGc.interactive = false;
        btnJoinGc.buttonMode = false;
    } else {
        gcJoinBg.beginFill(0x3B82F6);
        gcJoinBg.drawRoundedRect(-70, -25, 140, 50, 25);
        gcJoinBg.endFill();
        gcJoinTxt.text = '加 入';
        btnJoinGc.interactive = true;
        btnJoinGc.buttonMode = true;
    }

    gameClubContainer.visible = true;
};

// ================= 1. 首页 (Home Screen) =================
function initHomeScreen() {
    // a. 顶部状态栏 (金币与设置)
    const topBar = new PIXI.Container();
    topBar.y = sysInfo.safeArea ? sysInfo.safeArea.top + 10 : 30;

    // 1. 设置按钮 (柔和的矢量风格)
    const settingsBtn = new PIXI.Container();
    settingsBtn.x = 35;
    settingsBtn.y = 22;

    const settingsBg = new PIXI.Graphics();
    settingsBg.beginFill(0xFFFFFF, 0.85); // 柔和的半透明白
    settingsBg.lineStyle(2, 0xBCAAA4, 1); // 浅灰棕色描边
    settingsBg.drawCircle(0, 0, 18);
    settingsBg.endFill();
    const settingsIcon = new PIXI.Graphics();
    settingsIcon.beginFill(0x8D6E63); // 与描边同色系的深棕
    settingsIcon.drawRoundedRect(-8, -6, 16, 2.5, 1);
    settingsIcon.drawRoundedRect(-8, -0.5, 16, 2.5, 1);
    settingsIcon.drawRoundedRect(-8, 5, 16, 2.5, 1);
    settingsIcon.endFill();
    settingsBtn.addChild(settingsBg, settingsIcon);
    settingsBtn.interactive = true;
    settingsBtn.buttonMode = true;

    settingsBtn.on('pointerdown', () => { settingsBtn.alpha = 0.7; });
    settingsBtn.on('pointerup', () => {
        settingsBtn.alpha = 1;
        renderSettingsScreen();
    });
    settingsBtn.on('pointerupoutside', () => { settingsBtn.alpha = 1; });

    topBar.addChild(settingsBtn);

    // 2. 金币栏 (精致的圆角胶囊，内嵌手绘金币)
    const coinBar = new PIXI.Container();
    coinBar.x = 75;
    coinBar.y = 4;

    const coinBg = new PIXI.Graphics();
    coinBg.beginFill(0xFFFFFF, 0.85);
    coinBg.lineStyle(2, 0xBCAAA4, 1);
    coinBg.drawRoundedRect(0, 0, 140, 36, 18);
    coinBg.endFill();
    coinBar.addChild(coinBg);

    // 金币图标 (手绘高光金币，带 $ 符号)
    const coinIcon = new PIXI.Container();
    coinIcon.position.set(20, 18);

    const cOuter = new PIXI.Graphics();
    cOuter.beginFill(0xFFCA28); // 纯正明亮的金色
    cOuter.lineStyle(2, 0xFF8F00, 1); // 橙金边框
    cOuter.drawCircle(0, 0, 11);
    cOuter.endFill();

    const cInner = new PIXI.Graphics();
    cInner.beginFill(0xFFE082); // 柔和的浅金高光内圈
    cInner.drawCircle(0, 0, 7);
    cInner.endFill();

    const cSymbol = new PIXI.Text('$', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: '#E65100',
        fontWeight: '900'
    });
    cSymbol.anchor.set(0.5);
    cSymbol.position.set(0, 0); // 居中

    coinIcon.addChild(cOuter, cInner, cSymbol);
    coinBar.addChild(coinIcon);

    // 金币数值
    coinTextObj = new PIXI.Text(playerData.coins.toString(), {
        fontFamily: '"PingFang SC"',
        fontSize: 18,
        fill: '#5D4037',
        fontWeight: 'bold'
    });
    coinTextObj.anchor.set(0, 0.5);
    coinTextObj.position.set(40, 18);
    coinBar.addChild(coinTextObj);

    // 增加按钮
    const addBtn = new PIXI.Container();
    addBtn.position.set(122, 18);
    const addBg = new PIXI.Graphics();
    addBg.beginFill(0x81C784); // 柔和的绿
    addBg.drawCircle(0, 0, 12);
    addBg.endFill();
    const addIcon = new PIXI.Text('+', { fontSize: 18, fill: '#FFFFFF', fontWeight: 'bold' });
    addIcon.anchor.set(0.5);
    addIcon.position.set(0, -1);
    addBtn.addChild(addBg, addIcon);

    addBtn.interactive = true;
    addBtn.buttonMode = true;

    const pressAdd = () => { addBtn.alpha = 0.7; };
    const releaseAdd = () => {
        addBtn.alpha = 1;
        openShopScreen('props', 'coins');
    };

    addBtn.on('pointerdown', pressAdd);
    addBtn.on('touchstart', pressAdd);
    addBtn.on('pointerup', releaseAdd);
    addBtn.on('touchend', releaseAdd);
    addBtn.on('pointerupoutside', () => { addBtn.alpha = 1; });
    addBtn.on('touchendoutside', () => { addBtn.alpha = 1; });

    coinBar.addChild(addBtn);

    topBar.addChild(coinBar);

    homeContainer.addChild(topBar);

    // b. 气泡字大标题
    const logoObjs = createPremiumLogoContainer();
    const titleContainer = logoObjs.titleContainer;
    titleContainer.x = screenWidth / 2;
    titleContainer.y = screenHeight * 0.22;

    const maxTitleWidth = screenWidth * 0.85;
    const currentTitleWidth = 130 * 2 + 70 + 24; // 预估当前宽度
    const targetTitleScale = currentTitleWidth > maxTitleWidth ? maxTitleWidth / currentTitleWidth : 1;
    titleContainer.scale.set(targetTitleScale);

    // Dynamic Animation Loop
    let titleAnimTime = 0;
    app.ticker.add(() => {
        if (!homeContainer.visible) return;
        titleAnimTime += 0.05;
        updatePremiumLogoAnimation(logoObjs, titleAnimTime, targetTitleScale);
    });

    // 排行榜贴图更新
    app.ticker.add(() => {
        if (rankContainer.visible && sharedTexture) {
            sharedTexture.update();
        }
    });

    homeContainer.addChild(titleContainer);

    // 玩法帮助弹窗
    const renderHelpScreen = () => {
        while (helpContainer.children.length > 1) {
            helpContainer.removeChildAt(1);
        }

        const panelW = screenWidth * 0.85;
        const panelH = screenHeight * 0.75;

        const panel = new PIXI.Container();
        panel.x = screenWidth / 2;
        panel.y = screenHeight / 2;
        panel.interactive = true; // 拦截点击，防止点到下方背景触发关闭

        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0xFFF9E6); // Warm white
        bg.lineStyle(4, 0x8D6E63, 1); // Brown border
        bg.drawRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 24);
        bg.endFill();

        // Inner border
        bg.lineStyle(2, 0xD7CCC8, 1);
        bg.drawRoundedRect(-panelW / 2 + 10, -panelH / 2 + 10, panelW - 20, panelH - 20, 16);
        panel.addChild(bg);

        // Title
        const title = new PIXI.Text('玩法帮助', {
            fontFamily: '"PingFang SC"', fontSize: 28, fill: '#5D4037', fontWeight: '900',
            stroke: '#FFFFFF', strokeThickness: 4
        });
        title.anchor.set(0.5);
        title.position.set(0, -panelH / 2 + 40);
        panel.addChild(title);

        // Content Text
        const rules = [
            '【基础规则】',
            '1. 点击上方图案放入底部的暂存槽，凑齐3个相同即可消除。',
            '2. 暂存槽最多放7个，满了则失败。注意下方被遮挡的图案，合理规划。',
            '【特殊方块】',
            '3. 🧊 冰冻：放入暂存槽后，需通过合成同类方块来消除外层冰块。',
            '4. 💣 炸弹：必须在倒计时（点击步数）结束前消除，否则失败。',
            '【游戏模式】',
            '5. 🏆 主线：逐级挑战，难度逐渐上升，过关不奖金币。',
            '6. 🥊 擂台：每天随机生成高难度关卡，挑战极限！',
            '【获取金币】',
            '7. 擂台奖励：挑战擂台成功可获得 100 金币。',
            '8. 每日签到：首页点击日历签到，连续签到奖励丰厚。',
            '9. 游戏社区：进入游戏圈交流，每日可获 50 金币。',
            '【道具支持】',
            '10. 遇到困难可使用下方道具（撤销、移出、洗牌）。'
        ];

        const textStyle = new PIXI.TextStyle({
            fontFamily: '"PingFang SC"',
            fontSize: 13,
            fill: '#4E342E',
            wordWrap: true,
            wordWrapWidth: panelW - 60,
            breakWords: true, // Fix for Chinese word wrapping
            lineHeight: 18
        });

        const scrollHeight = panelH - 140;
        const scrollY = -panelH / 2 + 70;

        const scrollMask = new PIXI.Graphics();
        scrollMask.beginFill(0xffffff);
        scrollMask.drawRect(-panelW / 2 + 10, scrollY, panelW - 20, scrollHeight);
        scrollMask.endFill();
        panel.addChild(scrollMask);

        const scrollContainer = new PIXI.Container();
        scrollContainer.mask = scrollMask;
        panel.addChild(scrollContainer);

        let startY = scrollY + 5;
        rules.forEach((rule) => {
            const t = new PIXI.Text(rule, textStyle);
            t.anchor.set(0, 0);
            t.position.set(-panelW / 2 + 30, startY);

            const isCategory = rule.startsWith('【');
            if (isCategory) {
                t.style.fontWeight = 'bold';
                t.style.fill = '#5D4037';
                if (rule !== '【基础规则】') startY += 6;
                t.y = startY;
            }

            scrollContainer.addChild(t);
            startY += t.height + (isCategory ? 2 : 6);
        });

        const totalContentHeight = startY - scrollY;

        const contentBg = new PIXI.Graphics();
        contentBg.beginFill(0xffffff, 0.001); // invisible
        contentBg.drawRect(-panelW / 2 + 10, scrollY, panelW - 20, totalContentHeight + 20);
        contentBg.endFill();
        scrollContainer.addChildAt(contentBg, 0);

        scrollContainer.interactive = true;
        let isDragging = false;
        let dragStartY = 0;
        let containerStartY = 0;

        scrollContainer.on('pointerdown', (e: any) => {
            isDragging = true;
            dragStartY = e.data.global.y;
            containerStartY = scrollContainer.y;
        });
        scrollContainer.on('pointermove', (e: any) => {
            if (!isDragging) return;
            let targetY = containerStartY + (e.data.global.y - dragStartY);
            const minScrollY = Math.min(0, scrollHeight - totalContentHeight - 20);
            if (targetY > 0) targetY = 0;
            if (targetY < minScrollY) targetY = minScrollY;
            scrollContainer.y = targetY;
        });
        const stopDrag = () => { isDragging = false; };
        scrollContainer.on('pointerup', stopDrag);
        scrollContainer.on('pointerupoutside', stopDrag);
        scrollContainer.on('touchend', stopDrag);
        scrollContainer.on('touchendoutside', stopDrag);

        // Close Button
        const closeBtn = new PIXI.Container();
        closeBtn.position.set(0, panelH / 2 - 40);

        const closeBg = new PIXI.Graphics();
        closeBg.beginFill(0x81C784); // Green
        closeBg.lineStyle(2, 0xFFFFFF, 0.8);
        closeBg.drawRoundedRect(-60, -20, 120, 40, 20);
        closeBg.endFill();

        const closeText = new PIXI.Text('我知道了', {
            fontFamily: '"PingFang SC"', fontSize: 16, fill: '#FFFFFF', fontWeight: 'bold'
        });
        closeText.anchor.set(0.5);

        closeBtn.addChild(closeBg, closeText);
        closeBtn.interactive = true;
        closeBtn.buttonMode = true;

        const press = () => { closeBtn.scale.set(0.9); };
        const release = () => {
            closeBtn.scale.set(1);
            helpContainer.visible = false;
            homeContainer.visible = true;
        };

        closeBtn.on('pointerdown', press);
        closeBtn.on('touchstart', press);
        closeBtn.on('pointerup', release);
        closeBtn.on('touchend', release);
        closeBtn.on('pointerupoutside', release);
        closeBtn.on('touchendoutside', release);

        panel.addChild(closeBtn);
        helpContainer.addChild(panel);

        homeContainer.visible = false;
        helpContainer.visible = true;
    };

    function renderSettingsScreen() {
        while (settingsContainer.children.length > 1) {
            settingsContainer.removeChildAt(1);
        }

        const panelW = screenWidth * 0.8;
        const panelH = 380;

        const panel = new PIXI.Container();
        panel.x = screenWidth / 2;
        panel.y = screenHeight / 2;
        panel.interactive = true; // 拦截点击，防止点到下方背景触发关闭

        const panelBg = new PIXI.Graphics();
        panelBg.lineStyle(4, 0x8D6E63);
        panelBg.beginFill(0xFFFDF8);
        panelBg.drawRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 20);
        panelBg.endFill();
        panel.addChild(panelBg);

        const title = new PIXI.Text('系统设置', {
            fontFamily: '"PingFang SC"', fontSize: 24, fill: '#5D4037', fontWeight: 'bold'
        });
        title.anchor.set(0.5);
        title.y = -panelH / 2 + 35;
        panel.addChild(title);

        // 获取当前昵称和头像
        let nickname = '';
        try { nickname = wx.getStorageSync('playerNickname') || '匿名玩家'; } catch (e) { nickname = '匿名玩家'; }

        const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'];
        const getAvatarForName = (name: string) => {
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            return EMOJIS[Math.abs(hash) % EMOJIS.length];
        };

        const profileContainer = new PIXI.Container();
        profileContainer.y = -100;

        const profileBg = new PIXI.Graphics();
        profileBg.beginFill(0xF3F4F6); // 浅灰背景
        profileBg.drawRoundedRect(-panelW / 2 + 25, -25, panelW - 50, 50, 15);
        profileBg.endFill();

        const avatarText = new PIXI.Text(getAvatarForName(nickname), { fontSize: 24 });
        avatarText.anchor.set(0.5);
        avatarText.position.set(-panelW / 2 + 55, 0);

        let displayNickname = nickname;
        if (displayNickname.length > 8) {
            displayNickname = displayNickname.substring(0, 8) + '...';
        }

        const nameText = new PIXI.Text(displayNickname, {
            fontFamily: '"PingFang SC"', fontSize: 18, fill: '#374151', fontWeight: 'bold'
        });
        nameText.anchor.set(0, 0.5);
        nameText.position.set(-panelW / 2 + 80, 0);

        const editIcon = new PIXI.Text('修改 >', {
            fontFamily: '"PingFang SC"', fontSize: 14, fill: '#8B5CF6', fontWeight: 'bold'
        });
        editIcon.anchor.set(1, 0.5);
        editIcon.position.set(panelW / 2 - 40, 0);

        profileContainer.addChild(profileBg, avatarText, nameText, editIcon);
        profileContainer.interactive = true;
        profileContainer.buttonMode = true;
        profileContainer.on('pointerdown', () => {
            if (typeof wx === 'undefined') return;
            wx.showModal({
                title: '修改名片',
                content: '',
                editable: true,
                placeholderText: '起个响亮的名字...',
                success: (res) => {
                    if (res.confirm && res.content) {
                        const newName = res.content.substring(0, 12);
                        wx.setStorageSync('playerNickname', newName);
                        savePlayerData();
                        wx.showToast({ title: '修改成功', icon: 'success' });
                        renderSettingsScreen(); // 重新渲染以更新名字和头像
                    }
                }
            });
        });
        panel.addChild(profileContainer);

        // 创建开关项
        const createToggle = (label: string, yOffset: number, key: 'bgm' | 'sfx' | 'vibration', onChange: (val: boolean) => void) => {
            const item = new PIXI.Container();
            item.y = yOffset;

            const text = new PIXI.Text(label, {
                fontFamily: '"PingFang SC"', fontSize: 20, fill: '#5D4037', fontWeight: 'bold'
            });
            text.anchor.set(0, 0.5);
            text.x = -panelW / 2 + 40;

            const switchContainer = new PIXI.Container();
            switchContainer.x = panelW / 2 - 40;
            switchContainer.interactive = true;
            switchContainer.buttonMode = true;

            const bg = new PIXI.Graphics();
            const knob = new PIXI.Graphics();

            const drawSwitch = (isOn: boolean) => {
                bg.clear();
                bg.beginFill(isOn ? 0x4CAF50 : 0x9E9E9E);
                bg.drawRoundedRect(-25, -15, 50, 30, 15);
                bg.endFill();

                knob.clear();
                knob.beginFill(0xFFFFFF);
                knob.drawCircle(isOn ? 10 : -10, 0, 12);
                knob.endFill();
            };

            let currentVal = playerData.settings[key];
            drawSwitch(currentVal);

            switchContainer.addChild(bg, knob);

            switchContainer.on('pointerdown', () => {
                currentVal = !currentVal;
                playerData.settings[key] = currentVal;
                drawSwitch(currentVal);
                savePlayerData();
                onChange(currentVal);
            });

            item.addChild(text, switchContainer);
            panel.addChild(item);
        };

        createToggle('🎵 背景音乐', -30, 'bgm', (val) => {
            if (val) {
                if (bgmAudio) bgmAudio.play();
            } else {
                if (bgmAudio) bgmAudio.pause();
            }
        });
        createToggle('🔊 游戏音效', 30, 'sfx', () => { });
        createToggle('📳 震动反馈', 90, 'vibration', (val) => {
            if (val && typeof wx !== 'undefined' && (wx as any).vibrateShort) (wx as any).vibrateShort({ type: 'light' });
        });

        const closeBtn = new PIXI.Container();
        closeBtn.y = panelH / 2 + 40;
        const closeBg = new PIXI.Graphics();
        closeBg.beginFill(0xFF5252);
        closeBg.drawRoundedRect(-60, -25, 120, 50, 25);
        closeBg.endFill();
        const closeText = new PIXI.Text('关闭', {
            fontFamily: '"PingFang SC"', fontSize: 20, fill: '#FFFFFF', fontWeight: 'bold'
        });
        closeText.anchor.set(0.5);
        closeBtn.addChild(closeBg, closeText);
        closeBtn.interactive = true;
        closeBtn.buttonMode = true;
        closeBtn.on('pointerdown', () => {
            settingsContainer.visible = false;
            homeContainer.visible = true;
        });
        panel.addChild(closeBtn);

        settingsContainer.addChild(panel);

        homeContainer.visible = false;
        settingsContainer.visible = true;
    };



    const baseY = screenHeight * 0.52;
    const gap = 90;

    const sideBtnConfig = [
        { text: '每日签到', icon: '🎁', x: 50, y: baseY - gap },
        { text: '排行榜', icon: '🏆', x: 50, y: baseY },
        { text: '玩法帮助', icon: '❓', x: 50, y: baseY + gap },
        { text: '游戏圈', icon: '💬', x: screenWidth - 50, y: baseY - gap },
        { text: '皮肤商店', icon: '🎨', x: screenWidth - 50, y: baseY },
        { text: '道具商店', icon: '🎒', x: screenWidth - 50, y: baseY + gap },
    ];

    sideBtnConfig.forEach(cfg => {
        const btn = createSideButton(cfg.text, cfg.icon);
        btn.x = cfg.x;
        btn.y = cfg.y;

        if (cfg.text === '皮肤商店') {
            btn.on('pointerdown', () => openShopScreen('skin'));
        } else if (cfg.text === '道具商店') {
            btn.on('pointerdown', () => openShopScreen('props'));
        } else if (cfg.text === '玩法帮助') {
            btn.on('pointerdown', renderHelpScreen);
        } else if (cfg.text === '每日签到') {
            btn.on('pointerdown', openCheckInScreen);
        } else if (cfg.text === '游戏圈') {
            btn.on('pointerdown', openGameClubScreen);
        } else if (cfg.text === '排行榜') {
            const showRank = () => {
                homeContainer.visible = false;
                rankContainer.visible = true;
                if (typeof wx !== 'undefined' && typeof wx.getOpenDataContext === 'function') {
                    currentRankScope = 'friend';
                    currentRankMode = 'main';
                    updateRankUI(); // 默认切换到主线
                } else {
                    currentRankScope = 'global';
                    updateRankUI(); // 若没有开放数据域环境，默认显示全服
                }
            };
            btn.on('pointerdown', showRank);
            btn.on('touchstart', showRank);
        } else {
            btn.on('pointerdown', () => wx.showToast({ title: '暂未开放', icon: 'none' }));
            btn.on('touchstart', () => wx.showToast({ title: '暂未开放', icon: 'none' }));
        }

        homeContainer.addChild(btn);
    });

    // d. 底部双轨制核心玩法按钮
    // 主线闯关 (PVE)
    const pveBtn = createMainButton('主线闯关', 0xFF9800); // 橘色
    pveBtn.x = screenWidth / 2;
    pveBtn.y = screenHeight * 0.74;
    homeContainer.addChild(pveBtn);

    // ================== 添加关卡角标 ==================
    const levelBadge = new PIXI.Container();

    const badgeBg = new PIXI.Graphics();
    badgeBg.beginFill(0xFF5252);
    badgeBg.lineStyle(2, 0xFFFFFF);
    badgeBg.drawRoundedRect(0, 0, 70, 24, 12);
    badgeBg.endFill();

    const badgeText = new PIXI.Text(`第 ${playerData.level} 关`, {
        fontFamily: '"PingFang SC"', fontSize: 13, fill: '#FFFFFF', fontWeight: 'bold'
    });
    badgeText.anchor.set(0.5);
    badgeText.position.set(35, 12);

    levelBadge.addChild(badgeBg, badgeText);
    levelBadge.position.set(50, -40);

    app.ticker.add(() => {
        levelBadge.y = -40 + Math.sin(Date.now() / 200) * 4;
        if (badgeText.text !== `第 ${playerData.level} 关`) {
            badgeText.text = `第 ${playerData.level} 关`;
        }
    });

    const pveInner = pveBtn.getChildAt(0) as PIXI.Container;
    pveInner.addChild(levelBadge);
    // =================================================

    pveBtn.on('pointerdown', () => {
        currentGameMode = 'main';
        currentLevel = Math.max(currentLevel, playerData.level || 1); // 确保读取最新进度
        homeContainer.visible = false;
        gameContainer.visible = true;
        updateGlobalBackground(true, currentLevel);
        loadLevel(currentLevel);
    });
    pveBtn.on('touchstart', () => {
        currentGameMode = 'main';
        currentLevel = Math.max(currentLevel, playerData.level || 1);
        homeContainer.visible = false;
        gameContainer.visible = true;
        updateGlobalBackground(true, currentLevel);
        loadLevel(currentLevel);
    });

    // 每日社交擂台 (PVP)
    const pvpBtn = createMainButton('每日擂台', 0xE91E63); // 玫红，体现魔鬼难度
    pvpBtn.x = screenWidth / 2;
    pvpBtn.y = screenHeight * 0.86;
    homeContainer.addChild(pvpBtn);

    const lockIcon = new PIXI.Text('🔒 通关第 2 关解锁', { 
        fontFamily: '"PingFang SC", sans-serif', fontSize: 12, fill: '#FFFFFF', fontWeight: 'bold',
        stroke: '#000000', strokeThickness: 2
    });
    lockIcon.anchor.set(0.5);
    lockIcon.position.set(0, 36); 
    const pvpInner = pvpBtn.getChildAt(0) as PIXI.Container;
    pvpInner.addChild(lockIcon);

    // 动态更新每日擂台的解锁状态
    app.ticker.add(() => {
        if (!pvpBtn.parent || !pvpBtn.parent.visible) return;
        const isLocked = (playerData.level || 1) <= 2;
        pvpBtn.alpha = isLocked ? 0.7 : 1;
        lockIcon.visible = isLocked;
    });

    const startDaily = () => {
        if ((playerData.level || 1) <= 2) {
            if (typeof wx !== 'undefined') {
                wx.showModal({ title: '擂台未解锁', content: '每日擂台难度极高，包含各种特殊机制！\\n\\n为了保证游戏体验，请先通关主线第 2 关（教学关卡）熟悉基础规则哦。', showCancel: false, confirmText: '去闯关' });
            } else {
                alert('每日擂台未解锁：请先通关主线第 2 关熟悉规则！');
            }
            return;
        }
        currentGameMode = 'daily';
        homeContainer.visible = false;
        gameContainer.visible = true;
        updateGlobalBackground(true, 999);
        loadLevel(-1);
    };
    pvpBtn.on('pointerdown', startDaily);
    pvpBtn.on('touchstart', startDaily);
}

function createSideButton(textStr: string, emoji: string) {
    const btn = new PIXI.Container();
    const bg = new PIXI.Graphics();

    // 阴影
    bg.lineStyle(0);
    bg.beginFill(0x000000, 0.2);
    bg.drawRoundedRect(-35, -35, 70, 75, 15);
    bg.endFill();

    // 主体白底褐边
    bg.beginFill(0xFFFFFF);
    bg.lineStyle(4, 0x8D6E63);
    bg.drawRoundedRect(-35, -35, 70, 70, 15);
    bg.endFill();

    const iconText = new PIXI.Text(emoji, { fontSize: 28 });
    iconText.anchor.set(0.5);
    iconText.y = -10;

    const label = new PIXI.Text(textStr, {
        fontFamily: '"PingFang SC"', fontSize: 12, fill: '#FFFFFF', fontWeight: 'bold',
        stroke: '#FF9800', strokeThickness: 3
    });
    label.anchor.set(0.5);
    label.y = 20;

    btn.addChild(bg, iconText, label);
    btn.interactive = true;
    btn.buttonMode = true;

    btn.on('pointerdown', () => btn.scale.set(0.9));
    btn.on('touchstart', () => btn.scale.set(0.9));
    btn.on('pointerup', () => btn.scale.set(1));
    btn.on('touchend', () => btn.scale.set(1));
    btn.on('pointerupoutside', () => btn.scale.set(1));
    btn.on('touchendoutside', () => btn.scale.set(1));
    return btn;
}

function createMainButton(textStr: string, color: number) {
    const btn = new PIXI.Container();
    const inner = new PIXI.Container();
    const bg = new PIXI.Graphics();

    // 黑色阴影
    bg.lineStyle(0);
    bg.beginFill(0x000000, 0.3);
    bg.drawRoundedRect(-120, -30, 240, 68, 34);
    bg.endFill();

    // 主体
    bg.beginFill(color);
    bg.lineStyle(5, 0x3E2723); // 深褐粗边框
    bg.drawRoundedRect(-120, -30, 240, 60, 30);
    bg.endFill();

    // 高光
    bg.lineStyle(0);
    bg.beginFill(0xFFFFFF, 0.3);
    bg.drawRoundedRect(-100, -25, 200, 15, 8);
    bg.endFill();

    const text = new PIXI.Text(textStr, {
        fontFamily: '"PingFang SC"', fontSize: 24, fill: '#FFFFFF', fontWeight: '900',
        stroke: '#3E2723', strokeThickness: 5, letterSpacing: 2
    });
    text.anchor.set(0.5);

    inner.addChild(bg, text);
    btn.addChild(inner);
    btn.interactive = true;
    btn.buttonMode = true;

    btn.on('pointerdown', () => btn.scale.set(0.95));
    btn.on('touchstart', () => btn.scale.set(0.95));
    btn.on('pointerup', () => btn.scale.set(1));
    btn.on('touchend', () => btn.scale.set(1));
    btn.on('pointerupoutside', () => btn.scale.set(1));
    btn.on('touchendoutside', () => btn.scale.set(1));

    // 呼吸动画
    let animTime = Math.random() * Math.PI * 2;
    app.ticker.add(() => {
        if (!btn.parent || !btn.parent.visible) return;
        animTime += 0.05;
        inner.scale.set(1 + Math.sin(animTime) * 0.025);
    });

    return btn;
}

// ================= 2. 游戏页 (Game Screen) 设计 =================
interface GameTile extends PIXI.Container {
    tileType: number;
    tileState: 'grid' | 'moving' | 'slot' | 'eliminating';
    tileData: TileData;
}

const holdingArea: GameTile[] = [];
const eliminatingTiles: GameTile[] = [];
const DOCK_TILE_SCALE = 0.85;
const SLOT_STEP = TILE_SIZE * 1.25;
const SLOT_BG_WIDTH = TILE_SIZE * 1.15;
const SLOT_BG_HEIGHT = TILE_SIZE * 1.3;
const TILE_SLOT_OFFSET_Y = TILE_SIZE * -0.12;
const HOLDING_SLOTS = 7;
const HOLDING_START_X = (screenWidth - (HOLDING_SLOTS * SLOT_STEP)) / 2 + SLOT_STEP / 2;
const bottomSafe = sysInfo.safeArea ? sysInfo.safeArea.bottom : screenHeight;
const HOLDING_START_Y = bottomSafe - SLOT_BG_HEIGHT / 2 - 80;
const tileContainer = new PIXI.Container();
tileContainer.sortableChildren = true;

let currentLevel = playerData.level || 1;
let levelTopBarText: PIXI.Text;
let currentStartX = 0; // 用于记录当前关卡的动态居中起点

interface MoveRecord {
    tile: GameTile;
    source: 'grid' | 'extracted';
    slotIndex?: number;
}
const moveHistory: MoveRecord[] = [];
const extractedSlots: (GameTile | null)[] = [null, null, null];

// ================= 1.4. 工具函数: 渐变生成 =================
const gradientCache: { [key: string]: PIXI.Texture } = {};
function getGradientTexture(color1: string, color2: string, width: number, height: number): PIXI.Texture {
    const key = `${color1}-${color2}-${width}-${height}`;
    if (gradientCache[key]) return gradientCache[key];
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grd = ctx.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, color1);
        grd.addColorStop(1, color2);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
    }
    const tex = PIXI.Texture.from(canvas);
    gradientCache[key] = tex;
    return tex;
}

// ================= 1.5. 盲盒商店 (Shop Screen) =================
let currentShopType: 'skin' | 'props' = 'skin';
let currentShopTab: string = 'tiles';

function openShopScreen(type: 'skin' | 'props' = 'skin', tab?: string) {
    currentShopType = type;
    currentShopTab = tab ? tab : (type === 'skin' ? 'bgs' : 'props');
    shopContainer.visible = true;
    renderShopScreen();
}

function createShopCard(item: any, category: string, isUnlocked: boolean, isEquipped: boolean, cardW: number, cardH: number): PIXI.Container {
    const card = new PIXI.Container();

    // 1. Base & Border
    const base = new PIXI.Graphics();

    // Soft elegant shadow
    base.beginFill(0x000000, 0.08);
    base.drawRoundedRect(0, 4, cardW, cardH, 20);
    base.endFill();

    base.beginFill(0xFFFFFF);
    base.drawRoundedRect(0, 0, cardW, cardH, 20);
    base.endFill();
    card.addChild(base);

    // 2. Content & Mask
    const content = new PIXI.Container();
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRoundedRect(4, 4, cardW - 8, cardH - 8, 16);
    mask.endFill();
    content.mask = mask;
    card.addChild(mask);
    card.addChild(content);

    // -- Draw Category Specific Background --
    if (category === 'bgs') {
        let tex = homeBgTexture;
        if (item.id === 'bg1') tex = themeTextures[0];
        if (item.id === 'bg2') tex = themeTextures[1];
        if (item.id === 'bg3') tex = themeTextures[2];
        if (item.id === 'bg4') tex = themeTextures[3];
        if (item.id === 'bg5') tex = themeTextures[4];
        if (item.id === 'bg6') tex = themeTextures[5];
        if (item.id === 'bg7') tex = themeTextures[6];

        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.position.set(cardW / 2, cardH / 2);
        const scale = Math.max(cardW / sprite.texture.width, cardH / sprite.texture.height);
        sprite.scale.set(scale);
        content.addChild(sprite);
    } else {
        const gradients: any = {
            tiles: ['#F1F8E9', '#DCEDC8'],
            emojis: ['#FCE4EC', '#F8BBD0'],
            bgs: ['#E1F5FE', '#B3E5FC'],
            vfx: ['#F3E5F5', '#E1BEE7'],
            props: ['#FFF8E1', '#FFECB3'],
            coins: ['#FFF3E0', '#FFE082']
        };
        const [c1, c2] = gradients[category] || ['#F5F5F5', '#E0E0E0'];
        const bgTex = getGradientTexture(c1, c2, cardW, cardH);
        const bg = new PIXI.Sprite(bgTex);
        content.addChild(bg);

        // Subtle inner shadow / border for depth
        const innerBorder = new PIXI.Graphics();
        innerBorder.lineStyle(2, 0xFFFFFF, 0.8);
        innerBorder.drawRoundedRect(4, 4, cardW - 8, cardH - 8, 16);
        content.addChild(innerBorder);

        // draw icon in center
        if (category === 'tiles') {
            // 渲染对应的砖块示例，传入 item 作为 themeOverride
            const tilePreview = createTileGraphics({ id: 1, type: 1, z: 1, x: 0, y: 0, isLocked: false, isFrozen: false }, item);
            tilePreview.x = cardW / 2;
            tilePreview.y = cardH / 2 - 10;
            tilePreview.scale.set(1.5); // 放大预览
            content.addChild(tilePreview);
        } else if (category === 'emojis') {
            const previewContainer = new PIXI.Container();
            // Show a 3x3 grid of the first 9 textures
            for (let i = 0; i < 9; i++) {
                const s = new PIXI.Sprite(item.textures[i]);
                s.anchor.set(0.5);
                s.width = 40; s.height = 40; // 调整为合适大小
                s.x = (i % 3) * 50 - 50; // 加大间距 (50px 间距，图标 40px，中间留 10px 缝隙)
                s.y = Math.floor(i / 3) * 50 - 50;
                s.blendMode = PIXI.BLEND_MODES.NORMAL;
                previewContainer.addChild(s);
            }
            previewContainer.position.set(cardW / 2, cardH / 2 - 10);
            content.addChild(previewContainer);
        } else if (category === 'vfx') {
            const emojis: any = {
                'default': '💨',
                'star': '✨',
                'bubble': '🫧',
                'confetti': '🎉',
                'heart': '❤️',
                'music': '🎵'
            };
            const previewText = new PIXI.Text(emojis[item.id] || '✨', { fontSize: 45 });
            previewText.anchor.set(0.5);
            previewText.position.set(cardW / 2, cardH / 2 - 10);
            content.addChild(previewText);
        } else if (category === 'props' || category === 'coins') {
            const iconContainer = new PIXI.Container();
            iconContainer.position.set(cardW / 2, cardH / 2 - 12);

            // Draw an elegant glowing pedestal
            const glow = new PIXI.Graphics();
            const isAd = item.id === 'ad';
            const baseColor = category === 'props' ? 0xFFCA28 : (isAd ? 0xFF8A65 : 0x29B6F6);

            glow.beginFill(baseColor, 0.15);
            glow.drawCircle(0, 0, 36);
            glow.beginFill(baseColor, 0.3);
            glow.drawCircle(0, 0, 26);
            glow.beginFill(0xFFFFFF, 0.8);
            glow.drawCircle(0, 0, 18);
            glow.endFill();
            iconContainer.addChild(glow);

            let emojiStr = '🎁';
            if (category === 'props') {
                const emojis: any = { 'undo': '🔙', 'extract': '📤', 'shuffle': '🔀', 'bundle': '🎁' };
                emojiStr = emojis[item.id] || '🎁';
            } else {
                const emojis: any = { 'ad': '📺', 'share': '🤝' };
                emojiStr = emojis[item.id] || '🪙';
            }

            const previewText = new PIXI.Text(emojiStr, { fontSize: 38 });
            previewText.anchor.set(0.5);
            previewText.position.set(0, 0);
            previewText.style.dropShadow = true;
            previewText.style.dropShadowDistance = 3;
            previewText.style.dropShadowBlur = 3;
            previewText.style.dropShadowAlpha = 0.2;

            iconContainer.addChild(previewText);
            content.addChild(iconContainer);
        }
    }

    // 4. State Overlays
    const isConsumable = item.isConsumable || item.isVideo || item.isShare;

    if (item.isConsumable && item.id !== 'bundle' && (playerData.props as any)[item.id] !== undefined) {
        const count = (playerData.props as any)[item.id];
        // Elegant count badge
        const countContainer = new PIXI.Container();
        const countBg = new PIXI.Graphics();
        countBg.beginFill(0xFF8A65); // Soft elegant orange
        countBg.lineStyle(1, 0xFFFFFF, 0.8);
        countBg.drawRoundedRect(0, 0, 44, 20, 10);
        countBg.endFill();
        countContainer.addChild(countBg);

        const countText = new PIXI.Text(`余 ${count}`, {
            fontFamily: '"PingFang SC", sans-serif', fontSize: 11, fill: '#FFFFFF', fontWeight: 'bold'
        });
        countText.anchor.set(0.5);
        countText.position.set(22, 10);
        countContainer.addChild(countText);

        countContainer.position.set(cardW - 48, 8);
        content.addChild(countContainer);
    }

    if (isConsumable) {
        const actionContainer = new PIXI.Container();
        actionContainer.position.set(cardW / 2, cardH - 18);

        const actionBg = new PIXI.Graphics();
        const btnColor = item.isVideo ? 0xBA68C8 : (item.isShare ? 0x4FC3F7 : 0xFFCA28);
        actionBg.beginFill(btnColor);
        actionBg.lineStyle(2, 0xFFFFFF, 0.8);
        actionBg.drawRoundedRect(-48, -14, 96, 28, 14);
        actionBg.endFill();
        actionContainer.addChild(actionBg);

        const text = item.isVideo ? '看视频' : (item.isShare ? '去分享' : `${item.price} 金币`);
        const actionText = new PIXI.Text(text, { fontSize: 13, fill: '#FFFFFF', fontWeight: '900' });
        actionText.style.dropShadow = true;
        actionText.style.dropShadowDistance = 1;
        actionText.style.dropShadowAlpha = 0.2;
        actionText.anchor.set(0.5);
        actionContainer.addChild(actionText);

        content.addChild(actionContainer);
    } else if (isEquipped) {
        const checkBg = new PIXI.Graphics();
        checkBg.beginFill(0x4CAF50);
        checkBg.drawRoundedRect(cardW / 2 - 35, cardH - 30, 70, 24, 12);
        checkBg.endFill();
        content.addChild(checkBg);

        const checkText = new PIXI.Text('✅ 使用中', { fontSize: 12, fill: '#FFFFFF', fontWeight: 'bold' });
        checkText.anchor.set(0.5);
        checkText.position.set(cardW / 2, cardH - 18);
        content.addChild(checkText);
    } else if (!isUnlocked) {
        const darkOverlay = new PIXI.Graphics();
        darkOverlay.beginFill(0x000000, 0.15);
        darkOverlay.drawRect(0, 0, cardW, cardH);
        darkOverlay.endFill();
        content.addChild(darkOverlay);

        const lockContainer = new PIXI.Container();
        const lockBg = new PIXI.Graphics();
        lockBg.beginFill(0x607D8B, 0.9); // slate gray pill
        lockBg.lineStyle(2, 0xFFFFFF, 0.8);
        lockBg.drawRoundedRect(-48, -14, 96, 28, 14);
        lockBg.endFill();
        lockBg.position.set(cardW / 2, cardH - 18);
        lockContainer.addChild(lockBg);

        const priceText = new PIXI.Text(`🔒 ${item.price}`, { fontSize: 13, fill: '#FFFFFF', fontWeight: 'bold' });
        priceText.anchor.set(0.5);
        priceText.position.set(cardW / 2, cardH - 18);
        lockContainer.addChild(priceText);

        content.addChild(lockContainer);
    }

    // 5. Top Badge (Name)
    const badge = new PIXI.Graphics();
    badge.beginFill(0x8D6E63); // Warm premium brown
    badge.lineStyle(2, 0xFFFFFF, 1); // Clean white border
    badge.drawRoundedRect(cardW / 2 - 45, -10, 90, 22, 11);
    badge.endFill();
    card.addChild(badge);

    const badgeText = new PIXI.Text(item.name, { fontSize: 12, fill: '#FFFFFF', fontWeight: 'bold' });
    badgeText.anchor.set(0.5);
    badgeText.position.set(cardW / 2, 1);
    card.addChild(badgeText);

    return card;
}

function renderShopScreen() {
    shopContainer.removeChildren();

    // 实时同步刷新游戏内的道具按钮数量（保证半透明背景下能立刻看到数量变化）
    if (btnUndoGlobal) btnUndoGlobal.updateCount(playerData.props.undo);
    if (btnExtractGlobal) btnExtractGlobal.updateCount(playerData.props.extract);
    if (btnShuffleGlobal) btnShuffleGlobal.updateCount(playerData.props.shuffle);

    // BG: 使用半透明黑色，让玩家能直接看到装备的新背景
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x4E342E, 0.7); // 温暖的棕色半透明背景
    overlay.drawRect(0, 0, screenWidth, screenHeight);
    overlay.endFill();
    overlay.interactive = true;
    shopContainer.addChild(overlay);

    // TOP BAR (统一采用首页的清新矢量风格)
    const topBar = new PIXI.Container();
    topBar.y = sysInfo.safeArea ? sysInfo.safeArea.top + 10 : 30;
    shopContainer.addChild(topBar);

    // 1. 关闭/返回按钮 (精美圆形关闭键)
    const backBtn = new PIXI.Container();
    backBtn.x = 24;
    backBtn.y = 4;

    const backBg = new PIXI.Graphics();
    // 完全对齐旁边的“金币栏”风格
    backBg.beginFill(0xFFFFFF, 0.85);
    backBg.lineStyle(2, 0xBCAAA4, 1);
    backBg.drawCircle(18, 18, 18); // 直径36，与金币栏高度完全一致
    backBg.endFill();

    // 绘制清晰现代的 'X' 关闭图标
    const crossIcon = new PIXI.Graphics();
    crossIcon.lineStyle(3, 0x8D6E63, 1);
    crossIcon.moveTo(12.5, 12.5);
    crossIcon.lineTo(23.5, 23.5);
    crossIcon.moveTo(23.5, 12.5);
    crossIcon.lineTo(12.5, 23.5);

    backBtn.addChild(backBg, crossIcon);
    backBtn.interactive = true;
    backBtn.buttonMode = true;

    const closeHandler = () => {
        shopContainer.visible = false;
        if (btnUndoGlobal) btnUndoGlobal.updateCount(playerData.props.undo);
        if (btnExtractGlobal) btnExtractGlobal.updateCount(playerData.props.extract);
        if (btnShuffleGlobal) btnShuffleGlobal.updateCount(playerData.props.shuffle);
    };
    overlay.on('pointerdown', closeHandler);

    backBtn.on('pointerdown', () => { backBtn.scale.set(0.9); backBtn.alpha = 0.8; });
    backBtn.on('pointerup', () => { backBtn.scale.set(1); backBtn.alpha = 1; closeHandler(); });
    backBtn.on('pointerupoutside', () => { backBtn.scale.set(1); backBtn.alpha = 1; });

    topBar.addChild(backBtn);

    // 2. 金币栏
    const coinBar = new PIXI.Container();
    coinBar.x = 75;
    coinBar.y = 4;

    const coinBg = new PIXI.Graphics();
    coinBg.beginFill(0xFFFFFF, 0.85);
    coinBg.lineStyle(2, 0xBCAAA4, 1);
    coinBg.drawRoundedRect(0, 0, 140, 36, 18);
    coinBg.endFill();
    coinBar.addChild(coinBg);

    // 绘制精美的矢量金币
    const coinIcon = new PIXI.Container();
    coinIcon.position.set(18, 18);
    const cOuter = new PIXI.Graphics();
    cOuter.beginFill(0xFFCA28);
    cOuter.lineStyle(2, 0xFF8F00, 1);
    cOuter.drawCircle(0, 0, 12);
    cOuter.endFill();
    const cInner = new PIXI.Graphics();
    cInner.beginFill(0xFFE082);
    cInner.drawCircle(0, 0, 7);
    cInner.endFill();
    const cSymbol = new PIXI.Text('$', { fontFamily: 'Arial', fontSize: 14, fill: '#E65100', fontWeight: '900' });
    cSymbol.anchor.set(0.5);
    cSymbol.position.set(0, 0);
    coinIcon.addChild(cOuter, cInner, cSymbol);
    coinBar.addChild(coinIcon);

    // 金币数值
    const coinAmt = new PIXI.Text(`${playerData.coins}`, {
        fontFamily: '"PingFang SC"',
        fontSize: 18,
        fill: '#5D4037',
        fontWeight: 'bold'
    });
    coinAmt.anchor.set(0, 0.5);
    coinAmt.position.set(38, 18);
    coinBar.addChild(coinAmt);

    // 增加按钮
    const addBtn = new PIXI.Container();
    addBtn.position.set(122, 18);
    const addBg = new PIXI.Graphics();
    addBg.beginFill(0x81C784);
    addBg.drawCircle(0, 0, 12);
    addBg.endFill();
    const addIcon = new PIXI.Text('+', { fontSize: 18, fill: '#FFFFFF', fontWeight: 'bold' });
    addIcon.anchor.set(0.5);
    addIcon.position.set(0, -1);
    addBtn.addChild(addBg, addIcon);

    addBtn.interactive = true;
    addBtn.buttonMode = true;

    const pressShopAdd = () => { addBtn.alpha = 0.7; };
    const releaseShopAdd = () => {
        addBtn.alpha = 1;
        currentShopType = 'props';
        currentShopTab = 'coins';
        renderShopScreen();
    };

    addBtn.on('pointerdown', pressShopAdd);
    addBtn.on('touchstart', pressShopAdd);
    addBtn.on('pointerup', releaseShopAdd);
    addBtn.on('touchend', releaseShopAdd);
    addBtn.on('pointerupoutside', () => { addBtn.alpha = 1; });
    addBtn.on('touchendoutside', () => { addBtn.alpha = 1; });

    coinBar.addChild(addBtn);

    topBar.addChild(coinBar);



    // TABS (Pills)
    const skinTabs = [
        { id: 'bgs', label: '背景' },
        { id: 'tiles', label: '材质' },
        { id: 'emojis', label: '图案' },
        { id: 'vfx', label: '特效' }
    ];
    const propsTabs = [
        { id: 'props', label: '道具' },
        { id: 'coins', label: '金币' }
    ];
    const tabs = currentShopType === 'skin' ? skinTabs : propsTabs;
    // Tab Bar Background Pill
    const tabBarBg = new PIXI.Graphics();
    tabBarBg.beginFill(0x000000, 0.3);
    tabBarBg.drawRoundedRect(15, 60, screenWidth - 30, 44, 22);
    tabBarBg.endFill();
    topBar.addChild(tabBarBg);

    const tabWidth = (screenWidth - 30) / tabs.length;
    tabs.forEach((tab, index) => {
        const tabBtn = new PIXI.Graphics();
        const isSelected = currentShopTab === tab.id;

        if (isSelected) {
            tabBtn.beginFill(0xFFFFFF, 1);
        } else {
            tabBtn.beginFill(0xFFFFFF, 0.001); // Invisible but clickable background for inactive
        }
        tabBtn.drawRoundedRect(0, 0, tabWidth, 36, 18);
        tabBtn.endFill();
        tabBtn.x = 15 + index * tabWidth;
        tabBtn.y = 64;

        tabBtn.interactive = true;
        tabBtn.buttonMode = true;
        tabBtn.on('pointerdown', () => { currentShopTab = tab.id as any; renderShopScreen(); });
        tabBtn.on('touchstart', () => { currentShopTab = tab.id as any; renderShopScreen(); });

        const tabText = new PIXI.Text(tab.label, {
            fontSize: 14,
            fill: isSelected ? '#333333' : '#FFFFFF',
            fontWeight: isSelected ? '900' : 'bold'
        });
        tabText.anchor.set(0.5);
        tabText.position.set(tabWidth / 2, 18);
        tabBtn.addChild(tabText);
        topBar.addChild(tabBtn);
    });

    // SCROLLABLE AREA (Grid Layout)
    const startY = topBar.y + 115;
    const cardW = (screenWidth - 60) / 2;
    const cardH = cardW * 1.35;
    const scrollAreaHeight = screenHeight - startY - 20;

    const scrollContainer = new PIXI.Container();
    scrollContainer.y = startY;

    const scrollMask = new PIXI.Graphics();
    scrollMask.beginFill(0xFFFFFF);
    scrollMask.drawRect(0, startY, screenWidth, scrollAreaHeight);
    scrollMask.endFill();
    shopContainer.addChild(scrollMask);
    scrollContainer.mask = scrollMask;

    shopContainer.addChild(scrollContainer);

    // Scroll Logic variables
    let isDragging = false;
    let startTouchY = 0;
    let startScrollY = 0;
    let isClick = true;

    // Prevent accidental clicks bleeding through from screen transitions
    let canClick = false;
    setTimeout(() => { canClick = true; }, 300);

    let lastCardClickTime = 0;

    const items = SHOP_ITEMS[currentShopTab];

    const getEquipKey = (tab: string) => {
        if (tab === 'bgs') return 'bg';
        if (tab === 'tiles') return 'tile';
        if (tab === 'emojis') return 'emoji';
        return tab;
    };
    const equipKey = getEquipKey(currentShopTab);

    items.forEach((item: any, index: number) => {
        const col = index % 2;
        const row = Math.floor(index / 2);

        const isConsumable = item.isConsumable || item.isVideo || item.isShare;
        const isUnlocked = isConsumable || ((playerData.unlocked as any)[currentShopTab] && (playerData.unlocked as any)[currentShopTab].includes(item.id)) || item.price === 0;
        const isEquipped = !isConsumable && (playerData.equipped as any)[equipKey] === item.id;

        const card = createShopCard(item, currentShopTab, isUnlocked, isEquipped, cardW, cardH);
        card.x = 20 + col * (cardW + 20);
        card.y = 15 + row * (cardH + 25); // 15px top padding for badge

        card.interactive = true;
        card.buttonMode = true;
        const actionHandler = () => {
            const now = Date.now();
            if (now - lastCardClickTime < 500) return; // Prevent double firing from pointerup + touchend
            lastCardClickTime = now;

            if (!canClick) return; // Prevent transition bleed-through clicks
            if (!isClick) return; // Prevent action if user was dragging
            if (isEquipped) return;

            if (isConsumable) {
                if (item.isVideo) {
                    checkAndWatchAd(() => {
                        playerData.coins += 100;
                        savePlayerData();
                        renderShopScreen(); // refresh
                    });
                } else if (item.isShare) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (playerData.shareDate !== todayStr) {
                        playerData.shareDate = todayStr;
                        playerData.shareCount = 0;
                    }
                    if ((playerData.shareCount || 0) >= 3) {
                        if (typeof wx !== 'undefined') {
                            wx.showToast({ title: '今日分享奖励已达上限', icon: 'error' });
                        } else {
                            alert('今日分享奖励已达上限，请明天再来吧！');
                        }
                        return;
                    }

                    if (typeof wx !== 'undefined' && wx.shareAppMessage) {
                        wx.shareAppMessage({
                            title: '奇趣果宝消太好玩了，快来和我一起挑战最强关卡！'
                        });
                        // 微信取消了分享成功回调，小游戏通常在拉起面板后或延时发放奖励
                        setTimeout(() => {
                            playerData.shareCount = (playerData.shareCount || 0) + 1;
                            playerData.coins += 100;
                            savePlayerData();
                            renderShopScreen();
                            wx.showToast({ title: '分享成功！+100金币', icon: 'success' });
                        }, 2000);
                    } else {
                        // Web端/测试环境 fallback
                        playerData.shareCount = (playerData.shareCount || 0) + 1;
                        playerData.coins += 100;
                        savePlayerData();
                        renderShopScreen();
                        if (typeof wx !== 'undefined') wx.showToast({ title: '分享成功！+100金币', icon: 'success' });
                    }
                } else {
                    if (playerData.coins >= item.price) {
                        const confirmBuy = () => {
                            playerData.coins -= item.price;
                            if (item.id === 'undo') playerData.props.undo += 3;
                            if (item.id === 'extract') playerData.props.extract += 3;
                            if (item.id === 'shuffle') playerData.props.shuffle += 3;
                            if (item.id === 'bundle') {
                                playerData.props.undo += 3;
                                playerData.props.extract += 3;
                                playerData.props.shuffle += 3;
                            }
                            if (typeof wx !== 'undefined') wx.showToast({ title: '购买成功！' });
                            savePlayerData();
                            renderShopScreen();
                        };

                        if (typeof wx !== 'undefined') {
                            const descText = item.desc ? `\n(${item.desc})` : '';
                            wx.showModal({
                                title: '购买确认',
                                content: `确定花费 ${item.price} 金币购买「${item.name}」吗？${descText}`,
                                success: (res: any) => {
                                    if (res.confirm) confirmBuy();
                                }
                            });
                        } else {
                            confirmBuy();
                        }
                    } else {
                        if (typeof wx !== 'undefined') wx.showToast({ title: '金币不足！', icon: 'none' });
                    }
                }
                return;
            }

            if (isUnlocked) {
                (playerData.equipped as any)[equipKey] = item.id;
                savePlayerData();
                updateGlobalBackground(false); // 实时更新背景
                refreshAllGameTiles(); // 实时联动游戏内的所有砖块
                renderShopScreen(); // refresh
            } else {
                if (playerData.coins >= item.price) {
                    const confirmUnlock = () => {
                        playerData.coins -= item.price;
                        (playerData.unlocked as any)[currentShopTab].push(item.id);
                        (playerData.equipped as any)[equipKey] = item.id;
                        savePlayerData();
                        updateGlobalBackground(false); // 实时更新背景
                        refreshAllGameTiles(); // 实时联动游戏内的所有砖块
                        if (typeof wx !== 'undefined') wx.showToast({ title: '解锁成功！', icon: 'success' });
                        renderShopScreen();
                    };

                    if (typeof wx !== 'undefined') {
                        wx.showModal({
                            title: '解锁确认',
                            content: `确定花费 ${item.price} 金币解锁「${item.name}」吗？`,
                            success: (res: any) => {
                                if (res.confirm) confirmUnlock();
                            }
                        });
                    } else {
                        confirmUnlock();
                    }
                } else {
                    if (typeof wx !== 'undefined') wx.showToast({ title: '金币不足！', icon: 'none' });
                }
            }
        };
        // Bind to pointerup instead of pointerdown to allow dragging
        card.on('pointerup', actionHandler);
        card.on('touchend', actionHandler);

        scrollContainer.addChild(card);
    });

    const rows = Math.ceil(items.length / 2);
    const totalHeight = 15 + rows * (cardH + 25);
    const maxY = startY;
    const minY = Math.min(startY, startY + scrollAreaHeight - totalHeight - 20);

    // Interactive background to catch scroll events outside cards
    const hitArea = new PIXI.Graphics();
    hitArea.beginFill(0x000000, 0.001);
    hitArea.drawRect(0, 0, screenWidth, Math.max(totalHeight, scrollAreaHeight));
    hitArea.endFill();
    scrollContainer.addChildAt(hitArea, 0);

    scrollContainer.interactive = true;
    scrollContainer.on('pointerdown', (e: PIXI.InteractionEvent) => {
        isDragging = true;
        isClick = true;
        startTouchY = e.data.global.y;
        startScrollY = scrollContainer.y;
    });

    scrollContainer.on('pointermove', (e: PIXI.InteractionEvent) => {
        if (!isDragging) return;
        const currentY = e.data.global.y;
        const dy = currentY - startTouchY;
        if (Math.abs(dy) > 10) {
            isClick = false;
        }
        let targetY = startScrollY + dy;
        if (targetY > maxY) targetY = maxY + (targetY - maxY) * 0.3;
        if (targetY < minY) targetY = minY + (targetY - minY) * 0.3;
        scrollContainer.y = targetY;
    });

    const onDragEnd = () => {
        isDragging = false;
        if (scrollContainer.y > maxY) {
            scrollContainer.y = maxY;
        } else if (scrollContainer.y < minY) {
            scrollContainer.y = minY;
        }
    };

    scrollContainer.on('pointerup', onDragEnd);
    scrollContainer.on('pointerupoutside', onDragEnd);
}

function initGameScreen() {
    const topY = sysInfo.safeArea ? Math.max(sysInfo.safeArea.top + 10, 40) : 40;

    const backBtn = new PIXI.Container();
    const backBg = new PIXI.Graphics();
    backBg.beginFill(0x000000, 0.4);
    backBg.drawRoundedRect(0, 0, 60, 32, 16);
    backBg.endFill();
    const backText = new PIXI.Text('< 返回', { fill: '#FFFFFF', fontSize: 13 });
    backText.position.set(12, 8);
    backBtn.addChild(backBg, backText);
    backBtn.x = 10;
    backBtn.y = topY;
    backBtn.interactive = true;
    backBtn.buttonMode = true;
    backBtn.on('pointerdown', () => {
        backBtn.alpha = 0.7;
    });
    backBtn.on('pointerup', () => {
        backBtn.alpha = 1;
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        gameContainer.visible = false;
        homeContainer.visible = true;
        updateGlobalBackground(false);
    });
    backBtn.on('pointerupoutside', () => {
        backBtn.alpha = 1;
    });
    gameContainer.addChild(backBtn);

    const titleBg = new PIXI.Graphics();
    titleBg.beginFill(0x000000, 0.3);
    titleBg.drawRoundedRect(-70, -16, 140, 32, 16);
    titleBg.endFill();
    titleBg.x = screenWidth / 2;
    titleBg.y = topY + 16;
    gameContainer.addChild(titleBg);

    levelTopBarText = new PIXI.Text(`主线闯关 | 第 ${currentLevel} 关`, {
        fontFamily: '"PingFang SC"', fontSize: 14, fill: '#FFFFFF', fontWeight: 'bold'
    });
    levelTopBarText.anchor.set(0.5);
    levelTopBarText.position.set(screenWidth / 2, topY + 16);
    gameContainer.addChild(levelTopBarText);

    dailyTimerText = new PIXI.Text('00:00', {
        fontFamily: '"Arial Rounded MT Bold", "PingFang SC", sans-serif', 
        fontSize: 18, 
        fill: '#FFFFFF', 
        fontWeight: '900',
        stroke: '#4A6984', // 柔和的灰蓝色描边，与天空和半透明黑底座呼应
        strokeThickness: 3,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowAlpha: 0.2,
        dropShadowDistance: 2,
        dropShadowBlur: 2
    });
    dailyTimerText.anchor.set(0.5);
    dailyTimerText.position.set(screenWidth / 2, topY + 48); // 下移 8 个像素，防止和顶部的胶囊底座贴得太近
    dailyTimerText.visible = false;
    gameContainer.addChild(dailyTimerText);

    // The top right is reserved for WeChat's capsule, so we only put the text here.
    // The restart button has been moved to the bottom.


    // 计算底部槽位顶部的坐标
    const slotBaseY = HOLDING_START_Y - SLOT_BG_HEIGHT / 2 - 10;
    // 半透明磨砂游戏底板，自适应屏幕高度，顶端固定，底部抵住槽位上方
    const boardBgStartY = screenHeight * 0.15;
    const boardBgHeight = slotBaseY - boardBgStartY - 15;

    const boardBg = new PIXI.Graphics();
    boardBg.beginFill(0xFFFFFF, 0.35); // 玻璃质感
    boardBg.drawRoundedRect(15, boardBgStartY, screenWidth - 30, boardBgHeight, 25);
    boardBg.endFill();
    boardBg.lineStyle(3, 0xFFFFFF, 0.7);
    boardBg.drawRoundedRect(15, boardBgStartY, screenWidth - 30, boardBgHeight, 25);
    gameContainer.addChild(boardBg);

    // 移出区插槽底座 (放置提取出的方块)
    const extractBase = new PIXI.Graphics();
    extractBase.beginFill(0xFFFFFF, 0.45);
    const extractWidth = 3 * SLOT_STEP + 12;
    const extractBaseY = screenHeight * 0.15 + 16 - 10;
    extractBase.drawRoundedRect(screenWidth / 2 - extractWidth / 2, extractBaseY, extractWidth, SLOT_BG_HEIGHT + 20, 20);
    extractBase.endFill();
    extractBase.lineStyle(2, 0xFFFFFF, 0.8);
    extractBase.drawRoundedRect(screenWidth / 2 - extractWidth / 2 + 2, extractBaseY + 2, extractWidth - 4, SLOT_BG_HEIGHT + 16, 18);
    gameContainer.addChild(extractBase);

    const extractStartX = screenWidth / 2 - extractWidth / 2 + 6 + SLOT_STEP / 2;
    const extractStartY = screenHeight * 0.15 + 16 + SLOT_BG_HEIGHT / 2;

    for (let i = 0; i < 3; i++) {
        const slot = new PIXI.Graphics();
        // 加深背景色并增加内边框，使槽位更加清晰可见
        slot.beginFill(0x000000, 0.15);
        slot.drawRoundedRect(-SLOT_BG_WIDTH / 2, -SLOT_BG_HEIGHT / 2, SLOT_BG_WIDTH, SLOT_BG_HEIGHT, 12);
        slot.endFill();
        slot.lineStyle(2, 0x000000, 0.15);
        slot.drawRoundedRect(-SLOT_BG_WIDTH / 2, -SLOT_BG_HEIGHT / 2, SLOT_BG_WIDTH, SLOT_BG_HEIGHT, 12);

        slot.x = extractStartX + i * SLOT_STEP;
        slot.y = extractStartY;
        gameContainer.addChild(slot);
    }

    gameContainer.addChild(tileContainer);

    const slotBase = new PIXI.Graphics();
    slotBase.beginFill(0xFFFFFF, 0.45); // Glassmorphism translucent white
    const slotWidth = HOLDING_SLOTS * SLOT_STEP + 12;
    slotBase.drawRoundedRect(screenWidth / 2 - slotWidth / 2, HOLDING_START_Y - SLOT_BG_HEIGHT / 2 - 10, slotWidth, SLOT_BG_HEIGHT + 20, 20);
    slotBase.endFill();
    // Glass highlight
    slotBase.lineStyle(2, 0xFFFFFF, 0.8);
    slotBase.drawRoundedRect(screenWidth / 2 - slotWidth / 2 + 2, HOLDING_START_Y - SLOT_BG_HEIGHT / 2 - 8, slotWidth - 4, SLOT_BG_HEIGHT + 16, 18);
    gameContainer.addChild(slotBase);

    for (let i = 0; i < HOLDING_SLOTS; i++) {
        const slot = new PIXI.Graphics();
        // 同样加深主槽位的清晰度
        slot.beginFill(0x000000, 0.15);
        slot.drawRoundedRect(-SLOT_BG_WIDTH / 2, -SLOT_BG_HEIGHT / 2, SLOT_BG_WIDTH, SLOT_BG_HEIGHT, 12);
        slot.endFill();
        slot.lineStyle(2, 0x000000, 0.15);
        slot.drawRoundedRect(-SLOT_BG_WIDTH / 2, -SLOT_BG_HEIGHT / 2, SLOT_BG_WIDTH, SLOT_BG_HEIGHT, 12);

        slot.x = HOLDING_START_X + i * SLOT_STEP;
        slot.y = HOLDING_START_Y;
        gameContainer.addChild(slot);
    }

    // 道具栏 (撤销, 移出, 洗牌)
    const propsContainer = new PIXI.Container();
    propsContainer.y = HOLDING_START_Y + SLOT_BG_HEIGHT / 2 + 45;

    const btnWidth = 80;
    const btnSpacing = (screenWidth - btnWidth * 4) / 5;

    const btnRestart = createPropButton('重置', '', btnSpacing + btnWidth / 2);
    btnUndoGlobal = createPropButton('撤销', '', btnSpacing * 2 + btnWidth * 1.5, playerData.props.undo);
    btnExtractGlobal = createPropButton('移出', '', btnSpacing * 3 + btnWidth * 2.5, playerData.props.extract);
    btnShuffleGlobal = createPropButton('洗牌', '', btnSpacing * 4 + btnWidth * 3.5, playerData.props.shuffle);

    propsContainer.addChild(btnRestart, btnUndoGlobal, btnExtractGlobal, btnShuffleGlobal);
    gameContainer.addChild(propsContainer);

    const restartHandler = () => {
        const now = Date.now();
        if (now - lastGlobalBtnClickTime < 500) return;
        lastGlobalBtnClickTime = now;

        wx.showModal({
            title: '重新开始',
            content: '确定要重新开始本关吗？',
            success: (res: any) => {
                if (res.confirm) {
                    loadLevel(currentGameMode === 'daily' ? -1 : currentLevel);
                }
            }
        });
    };
    btnRestart.on('pointerup', restartHandler);
    btnRestart.on('touchend', restartHandler);
    btnUndoGlobal.on('pointerup', performUndo);
    btnUndoGlobal.on('touchend', performUndo);
    btnExtractGlobal.on('pointerup', performExtract);
    btnExtractGlobal.on('touchend', performExtract);
    btnShuffleGlobal.on('pointerup', performShuffle);
    btnShuffleGlobal.on('touchend', performShuffle);

    loadLevel(currentLevel);

    // 核心动画与匹配检测循环
    app.ticker.add(() => {
        [...holdingArea].forEach((tile) => {
            const index = holdingArea.indexOf(tile);
            if (index === -1 || tile.tileState === 'eliminating') return;

            const targetX = HOLDING_START_X + index * SLOT_STEP;
            const targetY = HOLDING_START_Y + TILE_SLOT_OFFSET_Y;

            if (Math.abs(tile.x - targetX) > 1 || Math.abs(tile.y - targetY) > 1 || Math.abs(tile.scale.x - DOCK_TILE_SCALE) > 0.05) {
                tile.x += (targetX - tile.x) * 0.3;
                tile.y += (targetY - tile.y) * 0.3;
                tile.scale.x += (DOCK_TILE_SCALE - tile.scale.x) * 0.3;
                tile.scale.y += (DOCK_TILE_SCALE - tile.scale.y) * 0.3;
                tile.tileState = 'moving';
            } else {
                tile.x = targetX;
                tile.y = targetY;
                tile.scale.set(DOCK_TILE_SCALE);
                if (tile.tileState === 'moving') {
                    tile.tileState = 'slot';
                    checkMatch();
                }
            }
        });

        // 集中处理消除动画，防止破坏主 Ticker
        for (let i = eliminatingTiles.length - 1; i >= 0; i--) {
            const t = eliminatingTiles[i];
            t.scale.x -= 0.15;
            t.scale.y -= 0.15;
            t.alpha -= 0.15;
            if (t.scale.x <= 0) {
                t.destroy();
                eliminatingTiles.splice(i, 1);
            }
        }
    });
}

function loadLevel(level: number) {
    if (gameContainer.visible) {
        updateGlobalBackground(true, level);
    }

    // 1. 清理旧数据
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimeSeconds = 0;

    while (tileContainer.children.length > 0) {
        tileContainer.children[0].destroy();
    }
    holdingArea.forEach(t => t.destroy());
    holdingArea.length = 0;
    eliminatingTiles.forEach(t => t.destroy());
    eliminatingTiles.length = 0;
    moveHistory.length = 0;
    for (let i = 0; i < extractedSlots.length; i++) {
        extractedSlots[i] = null;
    }

    // 2. 更新标题
    if (levelTopBarText) {
        if (currentGameMode === 'daily') {
            const date = new Date();
            const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
            levelTopBarText.text = `每日擂台 | ${dateStr}`;

            if (dailyTimerText) {
                dailyTimerText.text = '00:00';
                dailyTimerText.visible = true;
                gameStartTime = Date.now();
                gameTimerInterval = setInterval(() => {
                    gameTimeSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
                    const m = Math.floor(gameTimeSeconds / 60).toString().padStart(2, '0');
                    const s = (gameTimeSeconds % 60).toString().padStart(2, '0');
                    dailyTimerText!.text = `${m}:${s}`;
                }, 1000);
            }
        } else {
            levelTopBarText.text = `主线闯关 | 第 ${level} 关`;
            if (dailyTimerText) dailyTimerText.visible = false;
        }
    }

    // 3. 计算难度：规划【波浪式】无尽难度曲线 (支持上千关)
    let totalTiles = 30; // 第一关极简
    let seed = level;

    if (currentGameMode === 'daily') {
        const date = new Date();
        seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        totalTiles = 282; // 魔鬼难度，必须是 3 的倍数
    } else {
        if (level === 1) totalTiles = 30;
        else if (level === 2) totalTiles = 45;
        else if (level === 3) totalTiles = 60;
        else if (level === 4) totalTiles = 75;
        else if (level === 5) totalTiles = 90;
        else {
            // 第 6 关开始进入无尽模式，采用“波浪式循环”
            // 每 10 关为一个周期：难度会有小的波动，整体逐步上升
            const cycle = Math.floor((level - 6) / 10); // 周期数 (0, 1, 2...)
            const step = (level - 6) % 10;              // 周期内的第几关 (0 到 9)

            // 周期初基数随周期缓慢上升，最高基数不超过 240
            const base = Math.min(240, 90 + cycle * 12);
            // 周期内逐步上升，每关增加 6~9 块左右
            totalTiles = base + step * 9;
        }

        // 物理上限 300，到达 300 后靠打乱花色和负面方块的随机性来维持可玩性
        if (totalTiles > 300) totalTiles = 300;

        // 防御性编程：强制变为 3 的倍数
        totalTiles = Math.floor(totalTiles / 3) * 3;
    }

    // 重点：生成器内部会自动根据 totalTiles 强制分配图案种类
    // 每日擂台/主线闯关模式：固定关卡种子，确保全网一致
    const tilesData = LevelGenerator.generate(seed, totalTiles);

    tilesData.sort((a, b) => {
        if (a.z === b.z) return a.y - b.y;
        return a.z - b.z;
    });

    // 动态计算棋盘居中偏移量 (仅根据主棋盘数据计算，排除备用堆)
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    tilesData.forEach(d => {
        if (!d.isReserve) {
            if (d.x < minX) minX = d.x;
            if (d.x > maxX) maxX = d.x;
            if (d.y > maxY) maxY = d.y;
        }
    });
    const actualGridWidth = (maxX - minX + 1) * TILE_STEP_X;
    currentStartX = (screenWidth - actualGridWidth) / 2 + TILE_STEP_X / 2 - minX * TILE_STEP_X;

    // 计算整体 Y 轴上下边界，用于绝对垂直居中
    let minVisualY = Infinity;
    let maxVisualY = -Infinity;

    tilesData.forEach(data => {
        // 备用堆间距略微拉开，不至于太远
        if (data.isReserve) {
            data.y = maxY + 1.2;
        }

        const vy = data.y * TILE_STEP_Y + data.z * LAYER_OFFSET_Y;
        if (vy < minVisualY) minVisualY = vy;
        if (vy > maxVisualY) maxVisualY = vy;
    });

    // 计算中心对齐
    // 顶部避让区：确保不与上方的 extractedSlots 产生重叠
    const topBoundary = screenHeight * 0.15 + 16 + SLOT_BG_HEIGHT + 25;
    // 底部避让区：严格贴合半透明磨砂底板的内部
    const slotBaseY = HOLDING_START_Y - SLOT_BG_HEIGHT / 2 - 10;
    const boardBgBottomY = slotBaseY - 15;
    const bottomBoundary = boardBgBottomY - 15;
    const playAreaHeight = bottomBoundary - topBoundary;
    const playAreaCenterY = (topBoundary + bottomBoundary) / 2;

    // 内容总高度 (需加上方块自身的高度)
    const contentHeight = (maxVisualY - minVisualY) + TILE_SIZE;
    const contentCenterY = (minVisualY + maxVisualY) / 2 + TILE_SIZE / 2;

    // 动态 Y 轴缩放，确保大阵列在魔鬼难度下不超出屏幕边界
    let scaleY = 1.0;
    if (contentHeight > playAreaHeight) {
        scaleY = playAreaHeight / contentHeight;
    }

    tilesData.forEach(data => {
        const tile = createTileGraphics(data);
        tile.x = currentStartX + data.x * TILE_STEP_X + data.z * LAYER_OFFSET_X;

        const baseVy = data.y * TILE_STEP_Y + data.z * LAYER_OFFSET_Y;
        let localY = baseVy - contentCenterY + TILE_SIZE / 2;
        localY *= scaleY;

        tile.y = playAreaCenterY + localY;

        // 记录计算后的最终渲染坐标，以便撤回时能精准回到原位
        tile.tileData.renderX = tile.x;
        tile.tileData.renderY = tile.y;

        tileContainer.addChild(tile);
    });

    updateTileStates();

    // 在主线模式下，根据关卡初次展示新机制弹窗
    if (currentGameMode === 'main') {
        if (level === 10 && !playerData.unlockedItems.includes('hint_lock')) {
            playerData.unlockedItems.push('hint_lock');
            savePlayerData();
            setTimeout(() => {
                if (typeof wx !== 'undefined') wx.showModal({ title: '新机制：🔒 锁链方块', content: '被锁住的方块无法点击。\n\n当你成功消除一组(3个)其他方块时，最顶层的一把锁将会被解开！', showCancel: false, confirmText: '知道了' });
            }, 300);
        } else if (level === 20 && !playerData.unlockedItems.includes('hint_ice')) {
            playerData.unlockedItems.push('hint_ice');
            savePlayerData();
            setTimeout(() => {
                if (typeof wx !== 'undefined') wx.showModal({ title: '新机制：🧊 冰冻方块', content: '带有冰块的方块可以放入暂存槽，但在冰化之前无法参与消除！\n\n你需要成功消除一组（3个）其他任何图案的方块，就能产生震动，震碎暂存区里所有的冰块！\n\n被冻结时它会白白占用空间，请谨慎操作！', showCancel: false, confirmText: '知道了' });
            }, 300);
        } else if (level === 30 && !playerData.unlockedItems.includes('hint_bomb')) {
            playerData.unlockedItems.push('hint_bomb');
            savePlayerData();
            setTimeout(() => {
                if (typeof wx !== 'undefined') wx.showModal({ title: '新机制：💣 定时炸弹', content: '带有倒计时的炸弹极其危险！\n\n你每点击一次方块，倒计时就会减1。必须在倒计时变为0之前消除它，否则游戏直接失败！', showCancel: false, confirmText: '知道了' });
            }, 300);
        }
    } else if (currentGameMode === 'daily') {
        // 如果玩家越级打擂台，给一个汇总生存指南（仅弹一次）
        if (!playerData.unlockedItems.includes('hint_daily_guide')) {
            playerData.unlockedItems.push('hint_daily_guide');
            savePlayerData();
            
            setTimeout(() => {
                if (typeof wx !== 'undefined') {
                    wx.showModal({ 
                        title: '☠️ 擂台生存指南', 
                        content: '每日擂台融合了极其危险的特殊机制：\n\n🔒 锁链：需消除一组方块来解开表层。\n🧊 冰块：在暂存槽内无法消除，必须靠消除其他方块来震碎它。\n💣 炸弹：每次点击都会倒数，归零即死！\n\n准备好迎接真正的挑战了吗？', 
                        showCancel: false, 
                        confirmText: '准备好了' 
                    });
                } else {
                    alert('擂台生存指南：包含锁链、冰块、定时炸弹，请千万小心！');
                }
            }, 300);
        }
    }
}

const tileSkinTextures: Record<string, PIXI.Texture> = {
    'default': PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/tile_default_v7.png'),
    'mahjong': PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/tile_mahjong_v7.png'),
    'jelly': PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/tile_jelly_v7.png'),
    'wood': PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/tile_wood_v7.png'),
    'metal': PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/tile_metal_v7.png'),
    'biscuit': PIXI.Texture.from(CLOUD_STORAGE_BASE + 'assets/tile_biscuit_v7.png')
};

function drawTileBg(bg: PIXI.Sprite, tileId: string) {
    bg.texture = tileSkinTextures[tileId] || tileSkinTextures['default'];
    // Size is exactly proportional to the 168x190 Canvas we used in Node.js
    // Let's set height proportionally to the width so it doesn't squish.
    const targetFaceSize = TILE_SIZE * 1.05; // 稍微比网格大一点点显得饱满
    const scale = targetFaceSize / 128; // 128 is the face size in our generated PNG

    bg.width = 168 * scale;
    bg.height = 190 * scale;

    // Anchor X perfectly in the middle
    // Anchor Y at the face center (Y=84 out of 190 total height)
    bg.anchor.set(0.5, 84 / 190);
    bg.y = 0; // 不再需要 y 偏移，anchor 已经完美对齐了顶面
}

function refreshAllGameTiles() {
    const allTiles = [...(tileContainer.children as GameTile[]), ...holdingArea, ...extractedSlots.filter(t => t)];
    if (allTiles.length === 0) return;

    const equippedTile = SHOP_ITEMS.tiles.find((t: any) => t.id === playerData.equipped.tile) || SHOP_ITEMS.tiles[0];
    const equippedEmoji = SHOP_ITEMS.emojis.find((e: any) => e.id === playerData.equipped.emoji) || SHOP_ITEMS.emojis[0];

    allTiles.forEach(tile => {
        if (!tile) return;
        const bg = tile.getChildByName('bg') as PIXI.Sprite;
        if (bg) drawTileBg(bg, equippedTile.id);

        if (!tile.tileData.isBlind) {
            const patternNode = tile.getChildByName('patternNode') as PIXI.Sprite;
            if (patternNode && patternNode instanceof PIXI.Sprite) {
                patternNode.texture = equippedEmoji.textures[tile.tileType % equippedEmoji.textures.length];
            }
        }
    });
}

function createTileGraphics(data: TileData, themeOverride?: any): GameTile {
    const tile = new PIXI.Container() as unknown as GameTile;
    tile.tileType = data.type;
    tile.tileState = 'grid';
    tile.tileData = data;
    tile.zIndex = data.z * 10000 + data.y * 100 + data.x;

    const bg = new PIXI.Sprite();
    bg.name = 'bg';

    // 应用商城皮肤配置
    const equippedTile = themeOverride || SHOP_ITEMS.tiles.find((t: any) => t.id === playerData.equipped.tile) || SHOP_ITEMS.tiles[0];
    drawTileBg(bg, equippedTile.id);

    tile.addChild(bg);

    // 4. 图案 (使用 Sprite 支持多主题切图，兼顾盲盒的 Text)
    const equippedEmoji = SHOP_ITEMS.emojis.find((e: any) => e.id === playerData.equipped.emoji) || SHOP_ITEMS.emojis[0];

    let patternNode: PIXI.Sprite | PIXI.Text;
    if (data.isBlind) {
        patternNode = new PIXI.Text('?', new PIXI.TextStyle({
            fontFamily: '"Arial Rounded MT Bold", "PingFang SC", sans-serif',
            fontSize: TILE_SIZE * 0.7,
            fontWeight: 'bold',
            fill: '#8D6E63', // 柔和的浅棕色，不刺眼
            align: 'center'
        }));
    } else {
        const tex = equippedEmoji.textures[data.type % equippedEmoji.textures.length];
        patternNode = new PIXI.Sprite(tex);

        // 根据背景白色区域的大小，等比例自适应缩放（保持水果不规则的原始宽高比）
        const maxDimension = Math.max(tex.width, tex.height);
        const targetPatternSize = TILE_SIZE * 0.88; // 设定目标包围盒的最大边长
        patternNode.scale.set(targetPatternSize / maxDimension);

        patternNode.blendMode = PIXI.BLEND_MODES.NORMAL;
    }

    patternNode.name = 'patternNode';
    patternNode.anchor.set(0.5);

    let patternY = 0;
    if (equippedTile.id === 'metal') {
        patternY = -6; // 之前移了 -12 太多了，现在调成 -6 刚好在正中央
    } else if (equippedTile.id === 'biscuit') {
        patternY = -6;  // 饼干调成 -4
    }
    patternNode.y = patternY;

    tile.addChild(patternNode);

    // 5. 遮挡阴影层使用 tint 代替 Graphics，避免边缘白边露出

    const emojiFontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", "Microsoft YaHei", sans-serif';

    if (data.isLocked) {
        const lockIcon = new PIXI.Text('🔒', { fontFamily: emojiFontFamily, fontSize: TILE_SIZE * 0.5 });
        lockIcon.name = 'lockIcon';
        lockIcon.anchor.set(0.5);
        // 给锁加上一些半透明黑色底让它更明显
        const lockBg = new PIXI.Graphics();
        lockBg.beginFill(0x000000, 0.45);
        lockBg.drawRoundedRect(-TILE_SIZE / 2 - 1, -TILE_SIZE / 2 - 1, TILE_SIZE + 2, TILE_SIZE + 8, 12);
        lockBg.endFill();
        lockBg.name = 'lockBg';
        tile.addChild(lockBg, lockIcon);
    }

    if (data.isFrozen) {
        const iceOverlay = new PIXI.Graphics();
        iceOverlay.beginFill(0x81D4FA, 0.4); // 冰蓝色半透明
        iceOverlay.lineStyle(2, 0xFFFFFF, 0.8); // 白色结冰边缘
        iceOverlay.drawRoundedRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 12);
        iceOverlay.endFill();
        iceOverlay.name = 'iceOverlay';

        const iceIcon = new PIXI.Text('\u2744', { fontFamily: emojiFontFamily, fontSize: TILE_SIZE * 0.4 });
        iceIcon.name = 'iceIcon';
        iceIcon.alpha = 0.8;
        iceIcon.anchor.set(0.5);
        iceIcon.position.set(TILE_SIZE * 0.25, -TILE_SIZE * 0.25); // 右上角提示

        tile.addChild(iceOverlay, iceIcon);
    }

    if (data.bombTimer !== undefined) {
        const bombContainer = new PIXI.Container();
        bombContainer.name = 'bombBadge';

        const bombEmoji = new PIXI.Text('💣', { fontFamily: emojiFontFamily, fontSize: 13 });
        bombEmoji.anchor.set(0.5);
        bombEmoji.x = 0;

        const bombNum = new PIXI.Text(`${data.bombTimer}`, { 
            fontFamily: '"Arial Rounded MT Bold", "PingFang SC", sans-serif', 
            fontSize: 12, 
            fill: '#E53935', 
            fontWeight: '900',
            stroke: '#FFFFFF',
            strokeThickness: 3
        });
        bombNum.name = 'bombNumText';
        bombNum.anchor.set(0.5);
        bombNum.x = 14; 
        
        bombContainer.addChild(bombEmoji, bombNum);
        
        // 放置在方块左上角
        bombContainer.position.set(-TILE_SIZE / 2 + 10, -TILE_SIZE / 2 + 10);
        tile.addChild(bombContainer);
    }

    // 默认按照 0 计算 x，在 loadLevel 渲染时会被动态居中逻辑覆盖
    tile.x = data.x * TILE_SIZE + data.z * LAYER_OFFSET_X;
    tile.y = GRID_START_Y + data.y * TILE_SIZE + data.z * LAYER_OFFSET_Y;

    tile.interactive = true;
    tile.buttonMode = true;
    tile.on('pointerdown', () => onTileClicked(tile));
    tile.on('touchstart', () => onTileClicked(tile));

    return tile;
}

function updateTileStates() {
    const activeTiles = tileContainer.children as GameTile[];

    activeTiles.forEach(t1 => {
        if (extractedSlots.includes(t1)) return;

        let isCovered = false;
        // 检查是否有任何层级更高的方块压在它上面
        for (let i = 0; i < activeTiles.length; i++) {
            const t2 = activeTiles[i];
            if (t2 === t1) continue;
            if (extractedSlots.includes(t2)) continue;

            if (t2.tileData.z > t1.tileData.z) {
                const dx = Math.abs(t2.tileData.x - t1.tileData.x);
                const dy = Math.abs(t2.tileData.y - t1.tileData.y);
                // 距离小于 1.0 (考虑浮点误差用 0.95) 则代表有重叠
                if (dx < 0.95 && dy < 0.95) {
                    isCovered = true;
                    break;
                }
            }
        }

        const bg = t1.getChildByName('bg') as PIXI.Sprite;
        const pattern = t1.getChildByName('patternNode') as PIXI.Sprite | PIXI.Text;

        (t1 as any).isCovered = isCovered;

        if (isCovered) {
            if (bg) bg.tint = 0x888888;
            if (pattern) {
                if (t1.tileData.isBlind) pattern.alpha = 0.5;
                else (pattern as PIXI.Sprite).tint = 0x888888;
            }
            t1.interactive = false;
        } else {
            if (bg) bg.tint = 0xFFFFFF;
            if (pattern) {
                if (t1.tileData.isBlind) pattern.alpha = 1.0;
                else (pattern as PIXI.Sprite).tint = 0xFFFFFF;
            }
            // 未被遮挡时，如果被锁住，依然不可点击
            t1.interactive = !t1.tileData.isLocked;
        }
    });
}

function onTileClicked(tile: GameTile) {
    // 修复连点Bug: 如果方块已经被点击过，直接忽略
    if (tile.tileState !== 'grid') return;

    if (holdingArea.length >= HOLDING_SLOTS) {
        wx.showToast({ title: '暂存区已满', icon: 'none' });
        return;
    }

    // 如果是从移出区点击的，清空对应的插槽
    const extIdx = extractedSlots.indexOf(tile);
    let source: 'grid' | 'extracted' = 'grid';
    let slotIndex = -1;
    if (extIdx !== -1) {
        extractedSlots[extIdx] = null;
        source = 'extracted';
        slotIndex = extIdx;
    }

    tile.interactive = false;
    tileContainer.removeChild(tile);

    moveHistory.push({ tile, source, slotIndex });

    // 播放放入暂存区的音效
    playClickSFX();

    // 如果是盲牌，拿到手里才揭晓答案！
    if (tile.tileData.isBlind) {
        const patternNode = tile.getChildByName('patternNode');
        const equippedEmoji = SHOP_ITEMS.emojis.find((e: any) => e.id === playerData.equipped.emoji) || SHOP_ITEMS.emojis[0];
        let insertIndex = 1;
        if (patternNode) {
            insertIndex = tile.getChildIndex(patternNode);
            tile.removeChild(patternNode);
        }
        const tex = equippedEmoji.textures[tile.tileData.type % equippedEmoji.textures.length];
        const newPattern = new PIXI.Sprite(tex);
        newPattern.name = 'patternNode';
        newPattern.anchor.set(0.5);

        // 等比例自适应缩放（保持水果不规则的原始宽高比）
        const maxDimension = Math.max(tex.width, tex.height);
        const targetPatternSize = TILE_SIZE * 0.88;
        newPattern.scale.set(targetPatternSize / maxDimension);

        newPattern.blendMode = PIXI.BLEND_MODES.NORMAL;
        newPattern.y = 0; // 与 createTileGraphics 保持一致，绝对居中
        tile.addChildAt(newPattern, insertIndex);
        (tile.tileData as any).wasBlind = true;
        tile.tileData.isBlind = false;
    }

    // 方块被取走后，更新下方可能被解开的方块状态
    updateTileStates();

    // 炸弹倒数 (排除被完全遮挡的炸弹)
    const allTiles = [...(tileContainer.children as GameTile[]), ...holdingArea];
    allTiles.forEach(t => {
        if (t.tileData.bombTimer !== undefined) {
            // 被遮挡的炸弹不计时
            if ((t as any).isCovered) return;

            t.tileData.bombTimer--;
            const bombBadge = t.getChildByName('bombBadge') as PIXI.Container;
            if (bombBadge) {
                const bombNumText = bombBadge.getChildByName('bombNumText') as PIXI.Text;
                if (bombNumText) bombNumText.text = `${t.tileData.bombTimer}`;
            }
        }
    });

    gameContainer.addChild(tile);

    // 自动排序：插入到同类方块的最后
    let insertIndex = holdingArea.length;
    for (let i = 0; i < holdingArea.length; i++) {
        if (holdingArea[i].tileType === tile.tileType) {
            let lastOccurence = i;
            while (lastOccurence + 1 < holdingArea.length && holdingArea[lastOccurence + 1].tileType === tile.tileType) {
                lastOccurence++;
            }
            insertIndex = lastOccurence + 1;
            break;
        }
    }

    holdingArea.splice(insertIndex, 0, tile);
    tile.tileState = 'moving';
}

function playVfx(type: string, x: number, y: number) {
    const container = new PIXI.Container();
    container.position.set(x, y);
    gameContainer.addChild(container);

    const particles: any[] = [];

    if (type === 'default') {
        for (let i = 0; i < 6; i++) {
            const p = new PIXI.Graphics();
            p.beginFill(0xFFFFFF, 0.8);
            p.drawCircle(0, 0, 12 + Math.random() * 15);
            p.endFill();
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            particles.push({
                sprite: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.02,
                scaleSpeed: 0.02 + Math.random() * 0.03
            });
            container.addChild(p);
        }
    } else if (type === 'star') {
        for (let i = 0; i < 8; i++) {
            const p = new PIXI.Graphics();
            p.beginFill(Math.random() > 0.5 ? 0xFFD700 : 0xFFEA00);
            const s = 12 + Math.random() * 10;
            p.drawPolygon([0, -s, s * 0.2, -s * 0.2, s, 0, s * 0.2, s * 0.2, 0, s, -s * 0.2, s * 0.2, -s, 0, -s * 0.2, -s * 0.2]);
            p.endFill();
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            p.rotation = Math.random() * Math.PI;
            particles.push({
                sprite: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 0.3,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                scaleSpeed: -0.01
            });
            container.addChild(p);
        }
    } else if (type === 'bubble') {
        for (let i = 0; i < 8; i++) {
            const p = new PIXI.Graphics();
            const r = 8 + Math.random() * 12;
            p.lineStyle(2, 0x81D4FA, 0.8);
            p.beginFill(0xE1F5FE, 0.4);
            p.drawCircle(0, 0, r);
            p.endFill();
            // 添加气泡高光反光点
            p.lineStyle(0);
            p.beginFill(0xFFFFFF, 0.8);
            p.drawCircle(-r * 0.3, -r * 0.3, r * 0.2);
            p.endFill();

            const angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
            const speed = 2 + Math.random() * 4;
            particles.push({
                sprite: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.015,
                scaleSpeed: 0.01
            });
            container.addChild(p);
        }
    } else if (type === 'confetti') {
        const colors = [0xFF5252, 0x4CAF50, 0x2196F3, 0xFFEB3B, 0x9C27B0];
        for (let i = 0; i < 15; i++) {
            const p = new PIXI.Graphics();
            p.beginFill(colors[Math.floor(Math.random() * colors.length)]);
            p.drawRect(-4, -6, 8, 12);
            p.endFill();
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 5 + Math.random() * 7;
            particles.push({
                sprite: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 0.5,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.01,
                scaleSpeed: 0,
                gravity: 0.2
            });
            container.addChild(p);
        }
    } else if (type === 'heart') {
        const hearts = ['❤️', '💖', '💕'];
        for (let i = 0; i < 6; i++) {
            const p = new PIXI.Text(hearts[Math.floor(Math.random() * hearts.length)], { fontSize: 20 + Math.random() * 10 });
            p.anchor.set(0.5);
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 3;
            particles.push({
                sprite: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 0.1,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                scaleSpeed: 0.02,
                gravity: -0.05
            });
            container.addChild(p);
        }
    } else if (type === 'music') {
        const notes = ['🎵', '🎶', '🎹', '🎸'];
        for (let i = 0; i < 6; i++) {
            const p = new PIXI.Text(notes[Math.floor(Math.random() * notes.length)], { fontSize: 20 + Math.random() * 10 });
            p.anchor.set(0.5);
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 3 + Math.random() * 4;
            particles.push({
                sprite: p,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vr: (Math.random() - 0.5) * 0.2,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.015,
                scaleSpeed: 0,
                gravity: 0.1
            });
            container.addChild(p);
        }
    }

    const animate = (delta: number) => {
        let allDead = true;
        particles.forEach(p => {
            if (p.life > 0) {
                allDead = false;
                p.sprite.x += p.vx * delta;
                p.sprite.y += p.vy * delta;
                if (p.gravity) p.vy += p.gravity * delta;

                if (p.vr) p.sprite.rotation += p.vr * delta;
                if (p.scaleSpeed) {
                    p.sprite.scale.x += p.scaleSpeed * delta;
                    p.sprite.scale.y += p.scaleSpeed * delta;
                    if (p.sprite.scale.x < 0) p.sprite.scale.x = 0;
                    if (p.sprite.scale.y < 0) p.sprite.scale.y = 0;
                }
                p.life -= p.decay * delta;
                p.sprite.alpha = p.life;
            }
        });

        if (allDead) {
            container.destroy({ children: true });
            app.ticker.remove(animate);
        }
    };
    app.ticker.add(animate);
}

function checkMatch() {
    let matchedType = -1;
    let tilesToRemove: GameTile[] = [];

    const typeGroups = new Map<number, GameTile[]>();
    for (let i = 0; i < holdingArea.length; i++) {
        const t = holdingArea[i];
        // 冰冻方块无法参与合成
        if (!t.tileData.isFrozen) {
            if (!typeGroups.has(t.tileType)) typeGroups.set(t.tileType, []);
            typeGroups.get(t.tileType)!.push(t);

            if (typeGroups.get(t.tileType)!.length === 3) {
                matchedType = t.tileType;
                tilesToRemove = typeGroups.get(t.tileType)!;
                break;
            }
        }
    }

    if (matchedType !== -1) {
        moveHistory.length = 0; // 消除发生后无法撤销

        // 播放消除音效与震动
        playClearSFX();
        if (typeof wx !== 'undefined' && typeof wx.vibrateShort === 'function' && playerData?.settings?.vibration !== false) {
            try {
                (wx as any).vibrateShort({ type: 'heavy' });
            } catch (e) {
                (wx as any).vibrateShort({});
            }
        }

        // 从暂存区移除这三个方块
        tilesToRemove.forEach(t => {
            const index = holdingArea.indexOf(t);
            if (index !== -1) holdingArea.splice(index, 1);
        });

        tilesToRemove.forEach((t, i) => {
            t.tileState = 'eliminating';
            eliminatingTiles.push(t);

            // 应用商城特效皮肤
            if (i === 1) { // 选中间一个播放特效
                const equippedVfx = SHOP_ITEMS.vfx.find((v: any) => v.id === playerData.equipped.vfx) || SHOP_ITEMS.vfx[0];
                playVfx(equippedVfx.id, t.x, t.y);
            }
        });



        // 核心机制深化：成功消除一次，只能随机/最高层解锁【1个】锁链方块！
        const activeTiles = tileContainer.children as GameTile[];
        const lockedTiles = activeTiles.filter(t => t.tileData.isLocked);

        if (lockedTiles.length > 0) {
            // 找到最顶层（或者随机）的一个锁链方块进行解锁，防止一次性全部解开降低难度
            lockedTiles.sort((a, b) => b.tileData.z - a.tileData.z);
            const target = lockedTiles[0];
            target.tileData.isLocked = false;
            const lockIcon = target.getChildByName('lockIcon');
            const lockBg = target.getChildByName('lockBg');
            if (lockIcon) target.removeChild(lockIcon);
            if (lockBg) target.removeChild(lockBg);

            if (lockedTiles.length - 1 > 0) {
                wx.showToast({ title: `🔓 解锁 1 个！(还剩 ${lockedTiles.length - 1} 个)`, icon: 'none' });
            } else {
                wx.showToast({ title: `🔓 所有锁链已解除！`, icon: 'none' });
            }
            updateTileStates(); // 立即让解开的方块变得可点击
        }

        // 核心机制深化：成功消除一次，立刻融化暂存区里所有的冰冻方块！
        let unfreezedAny = false;
        holdingArea.forEach(t => {
            if (t.tileData.isFrozen) {
                t.tileData.isFrozen = false;
                const iceOverlay = t.getChildByName('iceOverlay');
                const iceIcon = t.getChildByName('iceIcon');
                if (iceOverlay) t.removeChild(iceOverlay);
                if (iceIcon) t.removeChild(iceIcon);
                unfreezedAny = true;
            }
        });
        if (unfreezedAny) {
            setTimeout(() => wx.showToast({ title: '🧊 冰块碎裂！', icon: 'none' }), 500);
            // 冰块融化后，可能会立刻触发新的连环消除（因为之前因为被冻住没能消除）
            setTimeout(() => checkMatch(), 300);
        }

        if (tileContainer.children.length === 0 && holdingArea.length === 0 && extractedSlots.filter(t => t).length === 0) {
            // Victory
            if (gameTimerInterval) clearInterval(gameTimerInterval);

            setTimeout(() => {
                if (currentGameMode === 'main') {
                    currentLevel++;
                    playerData.level = currentLevel;
                    savePlayerData();
                    wx.showModal({
                        title: '过关！',
                        content: `太棒了，即将进入第 ${currentLevel} 关`,
                        showCancel: false,
                        success: () => loadLevel(currentLevel)
                    });
                } else {
                    playerData.coins += 100;
                    savePlayerData('daily', gameTimeSeconds);

                    if (typeof wx !== 'undefined' && wx.setUserCloudStorage) {
                        wx.setUserCloudStorage({
                            KVDataList: [{ key: `daily_score_${getTodayString()}`, value: gameTimeSeconds.toString() }]
                        });
                    }

                    const m = Math.floor(gameTimeSeconds / 60).toString().padStart(2, '0');
                    const s = (gameTimeSeconds % 60).toString().padStart(2, '0');
                    wx.showModal({
                        title: '擂台通关！',
                        content: `太强了！你战胜了今天的魔鬼盘面！\n用时: ${m}:${s}\n奖励: 100 金币`,
                        cancelText: '返回',
                        confirmText: '炫耀一下',
                        success: (res: any) => {
                            if (res.confirm) {
                                if (typeof wx !== 'undefined' && wx.shareAppMessage) {
                                    wx.shareAppMessage({
                                        title: `我用时${m}分${s}秒通关了今天的魔鬼擂台，不服来战！`
                                    });
                                }
                            }
                            gameContainer.visible = false;
                            homeContainer.visible = true;
                            updateGlobalBackground(false);
                        }
                    });
                }
            }, 500);
        }
    } else {
        const allSettled = holdingArea.every(t => t.tileState === 'slot');
        if (allSettled) {
            const allTiles = [...(tileContainer.children as GameTile[]), ...holdingArea];
            const exploded = allTiles.some(t => t.tileData.bombTimer !== undefined && t.tileData.bombTimer <= 0 && t.tileState !== 'eliminating');

            if (exploded) {
                if (gameTimerInterval) clearInterval(gameTimerInterval);
                if (wx.vibrateLong) wx.vibrateLong();
                wx.showModal({
                    title: '💥 炸弹爆炸',
                    content: '未能在规定步数内拆除炸弹，挑战失败！',
                    showCancel: false,
                    success: () => loadLevel(currentGameMode === 'daily' ? -1 : currentLevel)
                });
            } else if (holdingArea.length >= HOLDING_SLOTS) {
                if (gameTimerInterval) clearInterval(gameTimerInterval);
                if (wx.vibrateLong) wx.vibrateLong();
                wx.showModal({
                    title: '挑战失败',
                    content: '暂存区已满，点击确定重新挑战本关',
                    showCancel: false,
                    success: () => loadLevel(currentGameMode === 'daily' ? -1 : currentLevel)
                });
            }
        }
    }
}

function createPropButton(name: string, icon: string, x: number, count?: number) {
    const btn = new PIXI.Container() as any;
    btn.x = x;
    const bg = new PIXI.Graphics();
    bg.beginFill(0xFFFFFF, 0.4);
    bg.lineStyle(2, 0xFFFFFF, 0.8);
    bg.drawRoundedRect(-40, -18, 80, 36, 18);
    bg.endFill();

    const iconText = new PIXI.Text(icon, { fontSize: 16 });
    iconText.anchor.set(0.5);
    iconText.position.set(-16, 0);

    const label = new PIXI.Text(name, {
        fontFamily: '"PingFang SC"', fontSize: 13, fill: '#333333', fontWeight: 'bold'
    });
    label.anchor.set(0.5);
    label.position.set(icon ? 12 : 0, 0);

    btn.addChild(bg, iconText, label);

    if (count !== undefined) {
        const badgeBg = new PIXI.Graphics();
        badgeBg.beginFill(0xFF5252);
        badgeBg.drawCircle(0, 0, 10);
        badgeBg.endFill();
        badgeBg.position.set(30, -14);

        const countText = new PIXI.Text(count > 99 ? '99+' : count.toString(), {
            fontFamily: 'Arial', fontSize: 10, fill: '#FFFFFF', fontWeight: 'bold'
        });
        countText.anchor.set(0.5);
        countText.position.set(30, -14);

        btn.addChild(badgeBg, countText);

        btn.updateCount = (newCount: number) => {
            countText.text = newCount > 99 ? '99+' : newCount.toString();
            badgeBg.visible = newCount > 0;
            countText.visible = newCount > 0;
        };
        btn.updateCount(count);
    }

    btn.interactive = true;
    btn.buttonMode = true;

    const press = () => btn.scale.set(0.9);
    const release = () => btn.scale.set(1);

    btn.on('pointerdown', press);
    btn.on('touchstart', press);
    btn.on('pointerup', release);
    btn.on('touchend', release);
    btn.on('pointerupoutside', release);
    btn.on('touchendoutside', release);

    return btn;
}

function watchAdToGetProp(propKey: 'undo' | 'extract' | 'shuffle') {
    wx.showModal({
        title: '道具不足',
        content: '观看视频广告，免费获取 1 个道具？',
        confirmText: '看广告',
        cancelText: '取消',
        success: (res: any) => {
            if (res.confirm) {
                checkAndWatchAd(() => {
                    playerData.props[propKey]++;
                    savePlayerData();

                    if (propKey === 'undo' && btnUndoGlobal) btnUndoGlobal.updateCount(playerData.props.undo);
                    if (propKey === 'extract' && btnExtractGlobal) btnExtractGlobal.updateCount(playerData.props.extract);
                    if (propKey === 'shuffle' && btnShuffleGlobal) btnShuffleGlobal.updateCount(playerData.props.shuffle);
                });
            } else {
                wx.showModal({
                    title: '不想看广告？',
                    content: '前往商店用金币购买？',
                    success: (res2: any) => {
                        if (res2.confirm) {
                            openShopScreen('props', 'coins');
                        }
                    }
                });
            }
        }
    });
}

function performUndo() {
    const now = Date.now();
    if (now - lastGlobalBtnClickTime < 500) return;
    lastGlobalBtnClickTime = now;

    if (moveHistory.length > 0) {
        if (playerData.props.undo <= 0) {
            watchAdToGetProp('undo');
            return;
        }
        playerData.props.undo--;
        savePlayerData();
        if (btnUndoGlobal) btnUndoGlobal.updateCount(playerData.props.undo);

        const record = moveHistory.pop()!;
        const tile = record.tile;
        const index = holdingArea.indexOf(tile);
        if (index !== -1) {
            holdingArea.splice(index, 1);

            if (record.source === 'extracted') {
                extractedSlots[record.slotIndex!] = tile;
                tileContainer.addChild(tile);
                tile.tileState = 'grid';

                const extractWidth = 3 * SLOT_STEP + 12;
                const extractStartX = screenWidth / 2 - extractWidth / 2 + 6 + SLOT_STEP / 2;
                const extractStartY = screenHeight * 0.15 + 16 + SLOT_BG_HEIGHT / 2;

                tile.x = extractStartX + record.slotIndex! * SLOT_STEP;
                tile.y = extractStartY + TILE_SLOT_OFFSET_Y;
                tile.zIndex = 999999;
            } else {
                // 恢复盲盒状态
                if ((tile.tileData as any).wasBlind) {
                    tile.tileData.isBlind = true;
                    (tile.tileData as any).wasBlind = false;
                    const patternNode = tile.getChildByName('patternNode');
                    if (patternNode) tile.removeChild(patternNode);
                    const qSprite = new PIXI.Text('❓', { fontSize: TILE_SIZE * 0.65, align: 'center' });
                    qSprite.name = 'patternNode';
                    qSprite.anchor.set(0.5);
                    const equippedTile = SHOP_ITEMS.tiles.find((t: any) => t.id === playerData.equipped.tile) || SHOP_ITEMS.tiles[0];
                    qSprite.y = (equippedTile.id === 'metal' || equippedTile.id === 'biscuit') ? -6 : 0;

                    // 将 qSprite 插入到 bg 之后，darkOverlay 之前
                    const bgNode = tile.getChildByName('bg');
                    const bgIndex = bgNode ? tile.getChildIndex(bgNode) : 0;
                    tile.addChildAt(qSprite, bgIndex + 1);
                }

                tileContainer.addChild(tile);
                tile.tileState = 'grid';
                tile.scale.set(1); // 恢复原大小
                tile.x = tile.tileData.renderX!;
                tile.y = tile.tileData.renderY!;
                tile.zIndex = tile.tileData.z * 10000 + tile.tileData.y * 100 + tile.tileData.x;
            }
            updateTileStates();
        }
    } else {
        wx.showToast({ title: '无法撤销', icon: 'none' });
    }
}

function performExtract() {
    const now = Date.now();
    if (now - lastGlobalBtnClickTime < 500) return;
    lastGlobalBtnClickTime = now;

    if (holdingArea.length === 0) {
        wx.showToast({ title: '暂存区为空', icon: 'none' });
        return;
    }

    if (playerData.props.extract <= 0) {
        watchAdToGetProp('extract');
        return;
    }

    const emptySlotIndices: number[] = [];
    for (let i = 0; i < extractedSlots.length; i++) {
        if (!extractedSlots[i]) emptySlotIndices.push(i);
    }

    if (emptySlotIndices.length === 0) {
        wx.showToast({ title: '移出区已满，请先消耗', icon: 'none' });
        return;
    }

    playerData.props.extract--;
    savePlayerData();
    if (btnExtractGlobal) btnExtractGlobal.updateCount(playerData.props.extract);

    const countToExtract = Math.min(3, holdingArea.length, emptySlotIndices.length);
    const toExtract = holdingArea.splice(0, countToExtract);

    const extractWidth = 3 * SLOT_STEP + 12;
    const extractStartX = screenWidth / 2 - extractWidth / 2 + 6 + SLOT_STEP / 2;
    const extractStartY = screenHeight * 0.15 + 16 + SLOT_BG_HEIGHT / 2;

    toExtract.forEach((t, idx) => {
        const slotIndex = emptySlotIndices[idx];
        extractedSlots[slotIndex] = t;

        tileContainer.addChild(t);
        t.tileState = 'grid';

        // 提取到移出区时，保持原有的 tileData 不变，以便撤回时能恢复位置
        t.x = extractStartX + slotIndex * SLOT_STEP;
        t.y = extractStartY + TILE_SLOT_OFFSET_Y;
        t.scale.set(DOCK_TILE_SCALE);
        t.zIndex = 999999;

        t.interactive = true;
    });
    updateTileStates();
    moveHistory.length = 0; // 提取后重置历史
}

function performShuffle() {
    const now = Date.now();
    if (now - lastGlobalBtnClickTime < 500) return;
    lastGlobalBtnClickTime = now;

    if (playerData.props.shuffle <= 0) {
        watchAdToGetProp('shuffle');
        return;
    }

    const activeTiles = tileContainer.children as GameTile[];
    if (activeTiles.length === 0) return;

    playerData.props.shuffle--;
    savePlayerData();
    if (btnShuffleGlobal) btnShuffleGlobal.updateCount(playerData.props.shuffle);

    const types = activeTiles.map(t => t.tileType);
    for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
    }

    activeTiles.forEach((t, idx) => {
        t.tileType = types[idx];
        t.tileData.type = types[idx]; // 必须同步更新 tileData 里的 type，否则盲盒翻开时会显示错误的图案
        if (t.tileData.isBlind) return;
        const equippedEmoji = SHOP_ITEMS.emojis.find((e: any) => e.id === playerData.equipped.emoji) || SHOP_ITEMS.emojis[0];
        const tex = equippedEmoji.textures[t.tileType % equippedEmoji.textures.length];
        const patternNode = t.getChildByName('patternNode') as PIXI.Sprite;
        if (patternNode && patternNode instanceof PIXI.Sprite) {
            patternNode.texture = tex;
        }
    });

    wx.showToast({ title: '洗牌成功', icon: 'none' });
}

// ================= 启动逻辑 =================
const loadingContainer = new PIXI.Container();
app.stage.addChild(loadingContainer);

const loadingBg = new PIXI.Graphics();
// Draw a soft vertical gradient from sky blue to light cyan
const steps = 40;
for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(0x87 + (0xE0 - 0x87) * ratio);
    const g = Math.round(0xCE + (0xFF - 0xCE) * ratio);
    const b = Math.round(0xFA + (0xFF - 0xFA) * ratio);
    const color = (r << 16) | (g << 8) | b;
    loadingBg.beginFill(color);
    loadingBg.drawRect(0, (i / steps) * screenHeight, screenWidth, (screenHeight / steps) + 2);
    loadingBg.endFill();
}
loadingContainer.addChild(loadingBg);

// Add some soft decorative floating clouds (circles)
const decorContainer = new PIXI.Container();
const decorCircles: { sprite: PIXI.Graphics, phase: number, speed: number }[] = [];
for (let i = 0; i < 6; i++) {
    const circle = new PIXI.Graphics();
    circle.beginFill(0xFFFFFF, 0.3 + Math.random() * 0.3); // Semi-transparent white
    circle.drawCircle(0, 0, 40 + Math.random() * 60);
    circle.endFill();
    circle.x = Math.random() * screenWidth;
    circle.y = Math.random() * screenHeight;
    decorContainer.addChild(circle);
    decorCircles.push({ sprite: circle, phase: Math.random() * Math.PI * 2, speed: 0.005 + Math.random() * 0.01 });
}
loadingContainer.addChild(decorContainer);

// Premium Multi-Layered Candy Logo (Imported from home screen logic)
const logoObjs = createPremiumLogoContainer();
const logoContainer = logoObjs.titleContainer;
logoContainer.position.set(screenWidth / 2, screenHeight * 0.2);

const maxLogoWidth = screenWidth * 0.85;
const currentLogoWidth = 130 * 2 + 70 + 24;
const targetLogoScale = currentLogoWidth > maxLogoWidth ? maxLogoWidth / currentLogoWidth : 1;
logoContainer.scale.set(targetLogoScale);

loadingContainer.addChild(logoContainer);

// Center illustration
const loadingArtTexture = PIXI.Texture.from(loadingArtBase64);
const loadingArtSprite = new PIXI.Sprite(loadingArtTexture);
loadingArtSprite.anchor.set(0.5);
// Scale logic will wait for texture to load
loadingArtSprite.position.set(screenWidth / 2, screenHeight * 0.45);
loadingContainer.addChild(loadingArtSprite);

// Dynamic animation for the loading art
let baseScale = 0;
if (loadingArtTexture.valid) {
    baseScale = (screenWidth * 0.6) / loadingArtTexture.frame.width;
    loadingArtSprite.scale.set(baseScale);
} else {
    loadingArtSprite.visible = false;
    loadingArtTexture.baseTexture.once('loaded', () => {
        baseScale = (screenWidth * 0.6) / loadingArtTexture.frame.width;
        loadingArtSprite.scale.set(baseScale);
        loadingArtSprite.visible = true;
    });
}
const baseY = screenHeight * 0.45;
let animTime = 0;
const floatAnimation = (delta: number) => {
    animTime += delta * 0.05;

    // Animate illustration (subtle breathing bounce)
    loadingArtSprite.y = baseY + Math.sin(animTime) * 6;
    const currentScale = baseScale * (1 + Math.cos(animTime * 1.5) * 0.03);
    loadingArtSprite.scale.set(currentScale);

    // Animate premium logo (reusing home screen logic)
    updatePremiumLogoAnimation(logoObjs, animTime * 1.5, targetLogoScale);

    // Animate background clouds
    decorCircles.forEach(cloud => {
        cloud.sprite.x += Math.cos(animTime * 0.2 + cloud.phase) * 0.5;
        cloud.sprite.y += Math.sin(animTime * 0.3 + cloud.phase) * 0.3;
        cloud.sprite.alpha = 0.5 + Math.sin(animTime * 0.5 + cloud.phase) * 0.2;
    });
};
app.ticker.add(floatAnimation);

// Progress Bar
const barWidth = screenWidth * 0.7; // Slightly shorter for elegance
const barHeight = 24;

const progressBg = new PIXI.Graphics();
// Clean semi-transparent dark pill background
progressBg.beginFill(0x000000, 0.2);
progressBg.drawRoundedRect(-barWidth / 2, 0, barWidth, barHeight, barHeight / 2);
progressBg.endFill();
// Subtle outer white stroke for premium feel
progressBg.lineStyle(3, 0xFFFFFF, 0.9);
progressBg.drawRoundedRect(-barWidth / 2, 0, barWidth, barHeight, barHeight / 2);
progressBg.position.set(screenWidth / 2, screenHeight * 0.75);

const progressBar = new PIXI.Graphics();
progressBar.position.set(screenWidth / 2, screenHeight * 0.75);

loadingContainer.addChild(progressBg, progressBar);

const loadingSubText = new PIXI.Text('正在准备精彩关卡...', {
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 16,
    fill: '#FFFFFF', // Clean white
    fontWeight: 'bold',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowDistance: 2,
    dropShadowBlur: 4,
    dropShadowAlpha: 0.3
});
loadingSubText.anchor.set(0.5);
loadingSubText.position.set(screenWidth / 2, screenHeight * 0.75 + 40);
loadingContainer.addChild(loadingSubText);

const advisoryText = new PIXI.Text('《健康游戏忠告》\n抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。\n适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。', {
    fontFamily: '"PingFang SC"',
    fontSize: 10,
    fill: '#999999',
    align: 'center',
    lineHeight: 16
});
advisoryText.anchor.set(0.5, 1);
advisoryText.position.set(screenWidth / 2, screenHeight - 40);
loadingContainer.addChild(advisoryText);

const basesToLoad = [
    loadingArtTexture.baseTexture,
    homeBgTexture.baseTexture,
    ...themeTextures.map(t => t.baseTexture),
    ...Object.values(tileSkinTextures).map(t => t.baseTexture),
    fruitBase, catBase, dessertBase,
    fruitBase2, catBase2, dessertBase2,
    oceanBase, oceanBase2,
    carBase, carBase2,
    animalBase, animalBase2
];

const uniqueBases = Array.from(new Set(basesToLoad));
let loadedCount = 0;
const MIN_LOADING_TIME = 0; // No artificial delay
const loadingStartTime = Date.now();

function checkLoadingComplete() {
    loadedCount++;
    const progressRatio = loadedCount / uniqueBases.length;

    progressBar.clear();
    if (progressRatio > 0.02) {
        const padding = 3;
        let innerW = Math.max(barHeight - padding * 2, (barWidth - padding * 2) * progressRatio);
        const innerH = barHeight - padding * 2;
        const startX = -barWidth / 2 + padding;
        const startY = padding;

        // Single vibrant, beautiful amber pill
        progressBar.beginFill(0xFFC107); // Vibrant bright amber/yellow
        progressBar.drawRoundedRect(startX, startY, innerW, innerH, innerH / 2);
        progressBar.endFill();
    }

    if (loadedCount === uniqueBases.length) {
        const timeElapsed = Date.now() - loadingStartTime;
        const delay = Math.max(0, MIN_LOADING_TIME - timeElapsed);

        setTimeout(() => {
            app.ticker.remove(floatAnimation);
            app.stage.removeChild(loadingContainer);
            loadingContainer.destroy({ children: true });

            initHomeScreen();
            initGameScreen();
            updateGlobalBackground(false);
        }, delay);
    }
}

uniqueBases.forEach(base => {
    if (base.valid) {
        checkLoadingComplete();
    } else {
        base.once('loaded', checkLoadingComplete);
        base.once('error', checkLoadingComplete);
    }
});
