package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"one-line-physics-backend/models"
	"one-line-physics-backend/routes"
)

func main() {
	var db *gorm.DB
	
	// 从微信云托管环境变量获取 MySQL 连接串
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		log.Println("警告: 未检测到 MYSQL_DSN 环境变量。目前运行在本地无数据库测试模式！")
	} else {
		var err error
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatalf("无法连接到数据库: %v", err)
		}
		log.Println("成功连接到 MySQL 数据库！")
		
		// 自动迁移表结构 (自动建表、增减字段等)
		err = db.AutoMigrate(&models.User{}, &models.Leaderboard{})
		if err != nil {
			log.Fatalf("数据库结构迁移失败: %v", err)
		}
	}

	// 初始化 Gin Web 框架
	r := gin.Default()

	// 提供静态文件访问服务（可选：把图片放在后端的 static 文件夹下）


	// 心跳检测接口，微信云托管健康检查使用
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// 注册分离出去的业务路由 (user.go 和 leaderboard.go)
	routes.SetupRoutes(r, db)

	// 获取微信云托管注入的监听端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 微信云托管通常默认为 80 端口，这里兼容本地 8080 测试
	}
	
	log.Printf("Golang 后端服务已启动，正在监听 %s 端口...", port)
	r.Run(":" + port)
}
