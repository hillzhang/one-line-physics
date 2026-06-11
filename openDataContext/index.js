let sharedCanvas = wx.getSharedCanvas();
let context = sharedCanvas.getContext('2d');

let currentScoreKey = 'score';
let currentFormat = 'level';
let currentTitle = '';

function drawLeaderboard(dataList) {
  let sysInfo = wx.getSystemInfoSync();
  let pixelRatio = sysInfo.pixelRatio || 2;
  
  // 清除画布 (使用物理像素大小)
  context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
  
  context.save();
  context.scale(pixelRatio, pixelRatio);

  context.fillRoundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    this.fill();
  };

  context.strokeRoundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    this.stroke();
  };

  let logicalWidth = sharedCanvas.width / pixelRatio;
  let logicalHeight = sharedCanvas.height / pixelRatio;
  let centerX = logicalWidth / 2;

  if (!dataList || dataList.length === 0) {
    context.fillStyle = '#8D6E63';
    context.font = 'bold 20px system-ui';
    context.textAlign = 'center';
    context.fillText('暂无好友游玩记录', centerX, logicalHeight / 2);
    context.restore();
    return;
  }


  let cardWidth = 300;
  let cardLeft = centerX - cardWidth / 2;

  // 画好友列表
  dataList.forEach((item, index) => {
    let cardHeight = 48;
    let y = index * 56 + 10; 

    // 背景卡片 (与主域排行榜颜色同步，交替深浅)
    if (index % 2 === 0) {
      context.fillStyle = 'rgba(55, 65, 81, 0.8)'; // 对应 0x374151
    } else {
      context.fillStyle = 'rgba(31, 41, 55, 0.8)'; // 对应 0x1F2937
    }
    context.fillRoundRect(cardLeft, y, cardWidth, cardHeight, 12);

    // 排名文字
    let rankX = cardLeft + 28;
    context.fillStyle = '#FBBF24'; // 全体使用金黄色名次，不要圆圈
    context.font = '900 16px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(`${index + 1}`, rankX, y + cardHeight / 2 + 1);

    // 头像
    let avatarX = cardLeft + 65;
    let avatarImg = wx.createImage();
    avatarImg.src = item.avatarUrl;
    avatarImg.onload = () => {
      context.save();
      context.scale(pixelRatio, pixelRatio);
      
      context.beginPath();
      context.arc(avatarX, y + cardHeight / 2, 14, 0, Math.PI * 2, false);
      context.clip();
      context.drawImage(avatarImg, avatarX - 14, y + cardHeight / 2 - 14, 28, 28);
      
      context.restore();
    };

    // 昵称
    context.fillStyle = '#FFFFFF';
    context.font = 'normal 15px system-ui';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    let nickname = item.nickname || '神秘玩家';
    if (nickname.length > 7) nickname = nickname.substring(0, 6) + '...';
    context.fillText(nickname, cardLeft + 90, y + cardHeight / 2 + 1);

    // 分数文字
    let score = 0;
    let scoreKV = item.KVDataList.find(kv => kv.key === currentScoreKey);
    if (scoreKV) score = parseInt(scoreKV.value, 10);

    let displayStr = '';
    if (currentFormat === 'time') {
      let m = Math.floor(score / 60).toString().padStart(2, '0');
      let s = (score % 60).toString().padStart(2, '0');
      displayStr = `${m}:${s}`;
    } else {
      displayStr = `${score} 关`;
    }

    // 绿色分数文字，靠右对齐，不需要底色徽章
    context.fillStyle = '#10B981'; // 翠绿色
    context.font = 'bold 15px system-ui';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(displayStr, cardLeft + cardWidth - 20, y + cardHeight / 2 + 1);
  });
  
  context.restore();
}

let cachedDataList = null;

wx.onMessage(data => {
  if (data.type === 'showLeaderboard') {
    currentScoreKey = data.scoreKey || 'score';
    currentFormat = data.formatType || 'level';
    currentTitle = data.title || '';

    let sysInfo = wx.getSystemInfoSync();
    let pixelRatio = sysInfo.pixelRatio || 2;
    let logicalWidth = sharedCanvas.width / pixelRatio;
    let logicalHeight = sharedCanvas.height / pixelRatio;

    // 强制先清理并显示正在加载
    context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
    context.save();
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = '#8D6E63';
    context.font = 'bold 24px system-ui';
    context.textAlign = 'center';
    context.fillText('加载中...', logicalWidth / 2, logicalHeight / 2);
    context.restore();

    wx.getFriendCloudStorage({
      keyList: [currentScoreKey],
      success: res => {
        let dataList = res.data || [];
        // 过滤掉没有当前分数的记录
        dataList = dataList.filter(item => item.KVDataList.some(kv => kv.key === currentScoreKey));

        // 按分数排序
        dataList.sort((a, b) => {
          let scoreA = currentFormat === 'time' ? 999999 : 0;
          let kvA = a.KVDataList.find(kv => kv.key === currentScoreKey);
          if (kvA) scoreA = parseInt(kvA.value, 10);

          let scoreB = currentFormat === 'time' ? 999999 : 0;
          let kvB = b.KVDataList.find(kv => kv.key === currentScoreKey);
          if (kvB) scoreB = parseInt(kvB.value, 10);

          return currentFormat === 'time' ? scoreA - scoreB : scoreB - scoreA;
        });
        cachedDataList = dataList; // 缓存成功的数据
        drawLeaderboard(dataList);
      },
      fail: err => {
        console.error('获取好友数据失败', err);

        // 如果有缓存，则使用缓存数据进行渲染（规避微信接口重复调用的隐私拦截Bug）
        if (cachedDataList) {
          console.warn('接口拉取失败，使用缓存的排行榜数据');
          drawLeaderboard(cachedDataList);
          return;
        }
        context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
        context.save();
        context.scale(pixelRatio, pixelRatio);

        context.fillStyle = '#EF4444';
        context.font = '16px system-ui';
        context.textAlign = 'center';

        let errorMsg = '加载失败: ' + (err.errMsg || JSON.stringify(err));
        context.fillText(errorMsg, logicalWidth / 2, logicalHeight / 2);

        context.fillStyle = '#666666';
        context.fillText('请检查AppID是否合法及隐私协议是否配置', logicalWidth / 2, logicalHeight / 2 + 30);
        context.restore();
      }
    });
  } else if (data.type === 'hideLeaderboard' || data.type === 'clear') {
    context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
  }
});
