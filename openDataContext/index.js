let sharedCanvas = wx.getSharedCanvas();
let context = sharedCanvas.getContext('2d');

let currentScoreKey = 'score';
let currentFormat = 'level';
let currentTitle = '';

function drawLeaderboard(dataList) {
  // 清除画布
  context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);

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

  let centerX = sharedCanvas.width / 2;

  if (!dataList || dataList.length === 0) {
    context.fillStyle = '#8D6E63';
    context.font = 'bold 20px system-ui';
    context.textAlign = 'center';
    context.fillText('暂无好友游玩记录', centerX, sharedCanvas.height / 2);
    return;
  }

  // 绘制标题
  context.fillStyle = '#FFFFFF';
  context.font = 'bold 24px system-ui';
  context.textAlign = 'center';
  const displayTitle = currentTitle || '🏆 好友排行榜';
  context.fillText(displayTitle, centerX, 40);

  let cardWidth = 300;
  let cardLeft = centerX - cardWidth / 2;

  // 画好友列表
  dataList.forEach((item, index) => {
    let y = index * 64 + 70; // 适配新的 sharedCanvas 高度

    // 绘制底部阴影
    context.fillStyle = 'rgba(0, 0, 0, 0.08)';
    context.fillRoundRect(cardLeft, y + 3, cardWidth, 52, 16);

    // 背景卡片 (纯白)
    context.fillStyle = '#FFFFFF';
    context.fillRoundRect(cardLeft, y, cardWidth, 52, 16);

    // 卡片内发光边框
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(245, 158, 11, 0.2)'; // 淡淡的金色边框
    context.strokeRoundRect(cardLeft, y, cardWidth, 52, 16);

    // 排名圆圈或文字
    let rankX = cardLeft + 28;
    if (index < 3) {
      context.beginPath();
      context.arc(rankX, y + 26, 12, 0, 2 * Math.PI);
      if (index === 0) context.fillStyle = '#F59E0B'; // 金
      else if (index === 1) context.fillStyle = '#94A3B8'; // 银
      else if (index === 2) context.fillStyle = '#B45309'; // 铜
      context.fill();

      context.lineWidth = 2;
      context.strokeStyle = '#FFFFFF';
      context.stroke();

      context.fillStyle = '#FFFFFF';
      context.font = '900 14px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${index + 1}`, rankX, y + 27);
    } else {
      context.fillStyle = '#9CA3AF'; // 灰色名次
      context.font = '900 16px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${index + 1}`, rankX, y + 27);
    }

    // 头像
    let avatarX = cardLeft + 65;
    let avatarImg = wx.createImage();
    avatarImg.src = item.avatarUrl;
    avatarImg.onload = () => {
      context.save();
      context.beginPath();
      context.arc(avatarX, y + 26, 16, 0, Math.PI * 2, false);
      context.clip();
      context.drawImage(avatarImg, avatarX - 16, y + 10, 32, 32);
      context.restore();
      
      // 头像边框
      context.beginPath();
      context.arc(avatarX, y + 26, 16, 0, Math.PI * 2, false);
      context.lineWidth = 2;
      context.strokeStyle = '#FDE68A'; // 浅金边
      context.stroke();
    };

    // 昵称
    context.fillStyle = '#5D4037';
    context.font = 'bold 15px system-ui';
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    let nickname = item.nickname || '神秘玩家';
    if (nickname.length > 7) nickname = nickname.substring(0, 6) + '...';
    context.fillText(nickname, cardLeft + 95, y + 26);

    // 分数胶囊徽章
    let score = 0;
    let scoreKV = item.KVDataList.find(kv => kv.key === currentScoreKey);
    if (scoreKV) score = parseInt(scoreKV.value, 10);

    let displayStr = '';
    if (currentFormat === 'time') {
      let m = Math.floor(score / 60).toString().padStart(2, '0');
      let s = (score % 60).toString().padStart(2, '0');
      displayStr = `${m}:${s}`;
    } else {
      displayStr = `第 ${score} 关`;
    }
    context.font = '900 13px system-ui';
    let textWidth = context.measureText(displayStr).width;
    let badgeWidth = Math.max(textWidth + 20, 56);
    let badgeHeight = 24;
    let badgeX = cardLeft + cardWidth - 12 - badgeWidth;
    let badgeY = y + 14;

    // 徽章底色
    context.fillStyle = '#ECFDF5';
    context.fillRoundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);
    // 徽章描边
    context.lineWidth = 1.5;
    context.strokeStyle = '#34D399';
    context.strokeRoundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight / 2);

    // 徽章文字
    context.fillStyle = '#059669';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // 取消 +1 偏移，使文字在部分设备上能更好地居中
    context.fillText(displayStr, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
  });
}

let cachedDataList = null;

wx.onMessage(data => {
  if (data.type === 'showLeaderboard') {
    currentScoreKey = data.scoreKey || 'score';
    currentFormat = data.formatType || 'level';
    currentTitle = data.title || '';

    // 强制先清理并显示正在加载
    context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
    context.fillStyle = '#8D6E63';
    context.font = 'bold 24px system-ui';
    context.textAlign = 'center';
    context.fillText('加载中...', sharedCanvas.width / 2, sharedCanvas.height / 2);

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

        context.fillStyle = '#EF4444';
        context.font = '16px system-ui';
        context.textAlign = 'center';

        let errorMsg = '加载失败: ' + (err.errMsg || JSON.stringify(err));
        context.fillText(errorMsg, sharedCanvas.width / 2, sharedCanvas.height / 2);

        context.fillStyle = '#666666';
        context.fillText('请检查AppID是否合法及隐私协议是否配置', sharedCanvas.width / 2, sharedCanvas.height / 2 + 30);
      }
    });
  } else if (data.type === 'hideLeaderboard' || data.type === 'clear') {
    context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
  }
});
