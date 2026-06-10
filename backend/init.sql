-- -----------------------------------------------------
-- 数据库初始化脚本: game_db
-- 
-- 注意: GORM 的 db.AutoMigrate 已经包含了建表能力，
-- 提供此 SQL 仅为方便手动预览或在控制台直接执行建库建表。
-- -----------------------------------------------------

-- 创建数据库 (如果不存在的话)
CREATE DATABASE IF NOT EXISTS `game_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `game_db`;

-- 1. 用户存档表 (`users`)
CREATE TABLE IF NOT EXISTS `users` (
  `openid` varchar(100) NOT NULL COMMENT '微信唯一身份ID',
  `coins` bigint DEFAULT 0 COMMENT '玩家金币数量',
  `level` bigint DEFAULT 1 COMMENT '通关等级/进度',
  `props_json` text COMMENT '持有的道具(存入JSON字符串)',
  `unlocked_json` text COMMENT '已解锁的皮肤(存入JSON字符串)',
  `equipped_json` text COMMENT '当前装备的皮肤(存入JSON字符串)',
  `settings_json` text COMMENT '玩家个人设置(音效震动等)',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家游戏云端存档表';

-- 2. 世界排行榜表 (`leaderboards`)
CREATE TABLE IF NOT EXISTS `leaderboards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) DEFAULT NULL COMMENT '微信OpenID',
  `avatar_url` varchar(255) DEFAULT NULL COMMENT '玩家头像CDN链接',
  `nickname` varchar(100) DEFAULT NULL COMMENT '玩家昵称',
  `score` bigint DEFAULT NULL COMMENT '分数或通关耗时',
  `mode` varchar(50) DEFAULT NULL COMMENT '排行榜模式: main主线 / daily日常擂台',
  `created_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_leaderboards_openid` (`openid`),
  KEY `idx_leaderboards_score` (`score`),
  KEY `idx_leaderboards_mode` (`mode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='世界排行榜记录表';
