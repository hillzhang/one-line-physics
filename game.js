// 提前创建主 Canvas 并挂载到全局
const mainCanvas = wx.createCanvas();
const sysInfo = wx.getSystemInfoSync();

// 必须补全 clientWidth / clientHeight，否则 PixiJS 交互映射坐标为 NaN!
mainCanvas.clientWidth = sysInfo.windowWidth;
mainCanvas.clientHeight = sysInfo.windowHeight;
mainCanvas.width = sysInfo.windowWidth * sysInfo.pixelRatio;
mainCanvas.height = sysInfo.windowHeight * sysInfo.pixelRatio;

const eventListeners = {};
function addListener(type, listener) {
    if (!eventListeners[type]) eventListeners[type] = [];
    eventListeners[type].push(listener);
}
function removeListener(type, listener) {
    if (eventListeners[type]) {
        const idx = eventListeners[type].indexOf(listener);
        if (idx !== -1) eventListeners[type].splice(idx, 1);
    }
}

mainCanvas.addEventListener = addListener;
mainCanvas.removeEventListener = removeListener;

function dispatchTouchEvent(type, pointerType, res) {
    const syntheticEvent = Object.assign({}, res);
    syntheticEvent.type = type;
    syntheticEvent.preventDefault = function() {};
    syntheticEvent.stopPropagation = function() {};
    syntheticEvent.target = mainCanvas;
    syntheticEvent.currentTarget = mainCanvas;
    syntheticEvent.timeStamp = Date.now();
    
    // 补全坐标
    const formatTouch = (t) => {
        if (t.clientX === undefined) t.clientX = t.pageX || 0;
        if (t.clientY === undefined) t.clientY = t.pageY || 0;
    };
    if (syntheticEvent.touches) syntheticEvent.touches.forEach(formatTouch);
    if (syntheticEvent.changedTouches) syntheticEvent.changedTouches.forEach(formatTouch);

    // 补全 PointerEvent 的特殊字段 (PixiJS v6 强依赖)
    if (syntheticEvent.changedTouches && syntheticEvent.changedTouches.length > 0) {
        syntheticEvent.pointerId = syntheticEvent.changedTouches[0].identifier || 0;
        syntheticEvent.clientX = syntheticEvent.changedTouches[0].clientX;
        syntheticEvent.clientY = syntheticEvent.changedTouches[0].clientY;
    } else {
        syntheticEvent.pointerId = 0;
        syntheticEvent.clientX = 0;
        syntheticEvent.clientY = 0;
    }
    syntheticEvent.pointerType = 'touch';
    syntheticEvent.isPrimary = true;

    if (eventListeners[type]) {
        const listeners = eventListeners[type].slice();
        listeners.forEach(listener => listener(syntheticEvent));
    }
}

wx.onTouchStart((res) => { 
    dispatchTouchEvent('touchstart', null, res); 
    dispatchTouchEvent('pointerdown', null, res); 
});
wx.onTouchMove((res) => { 
    dispatchTouchEvent('touchmove', null, res); 
    dispatchTouchEvent('pointermove', null, res); 
});
wx.onTouchEnd((res) => { 
    dispatchTouchEvent('touchend', null, res); 
    dispatchTouchEvent('pointerup', null, res); 
});
wx.onTouchCancel((res) => { 
    dispatchTouchEvent('touchcancel', null, res); 
    dispatchTouchEvent('pointercancel', null, res); 
});

mainCanvas.style = mainCanvas.style || {};
mainCanvas.tagName = 'CANVAS';
mainCanvas.nodeName = 'CANVAS';
GameGlobal.canvas = mainCanvas;

// DOM/BOM Polyfill (解决 HTMLImageElement 等未定义报错)
GameGlobal.window = GameGlobal;
GameGlobal.navigator = GameGlobal.navigator || { userAgent: 'wechat' };

// Polyfill location 避免 PixiJS 读取跨域配置时报错 (e.g. Cannot read properties of undefined (reading 'port'))
if (!GameGlobal.location) {
    GameGlobal.location = {
        href: '', protocol: '', host: '', hostname: '', port: '', pathname: '', search: '', hash: ''
    };
}
if (!GameGlobal.window.location) {
    GameGlobal.window.location = GameGlobal.location;
}

// 强制接管 PixiJS 的 instanceof 校验
class FakeCanvas {
    static [Symbol.hasInstance](obj) { return obj && typeof obj.getContext === 'function'; }
}
class FakeImage {
    static [Symbol.hasInstance](obj) { return obj && obj.src !== undefined; }
}
class FakeVideo {
    static [Symbol.hasInstance]() { return false; }
}

// 解决 new Image() 抛出 Illegal constructor 的问题
GameGlobal.Image = function() { return wx.createImage(); };
GameGlobal.HTMLImageElement = GameGlobal.HTMLImageElement || FakeImage;
GameGlobal.HTMLCanvasElement = GameGlobal.HTMLCanvasElement || FakeCanvas;
GameGlobal.HTMLVideoElement = GameGlobal.HTMLVideoElement || FakeVideo;
GameGlobal.WebGLRenderingContext = GameGlobal.WebGLRenderingContext || {};

// 强制路由 window 和 document 的事件监听
GameGlobal.window.addEventListener = addListener;
GameGlobal.window.removeEventListener = removeListener;
GameGlobal.document = GameGlobal.document || {
    createElement(type) {
        if (type === 'canvas') {
            const newCanvas = wx.createCanvas();
            newCanvas.style = newCanvas.style || {};
            return newCanvas;
        }
        if (type === 'image') return wx.createImage();
        return { 
            style: {},
            setAttribute: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            appendChild: () => {},
            removeChild: () => {},
            getContext: () => null
        };
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    createElementNS(ns, type) { return this.createElement(type); },
    head: { appendChild: () => {}, style: {} },
    body: { appendChild: () => {}, style: {} },
    documentElement: { style: {} },
    addEventListener: addListener,
    removeEventListener: removeListener
};


// 修复 PixiJS 触摸坐标计算 (踩坑 1)
if (GameGlobal.canvas) {
  GameGlobal.canvas.getBoundingClientRect = function() {
    return { 
      x: 0, 
      y: 0, 
      width: sysInfo.windowWidth, 
      height: sysInfo.windowHeight, 
      left: 0, 
      top: 0 
    };
  };
}

// 引入构建后的主逻辑
require('./dist/main.js');
