package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"one-line-physics-backend/controllers"
)

// SetupRoutes 集中管理所有的后端 API 路由
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// 所有以 /api 开头的接口
	api := r.Group("/api")
	{
		// ---- 游戏存档同步接口 ----
		// POST /api/user/sync  -> 保存数据
		// GET  /api/user/data  -> 获取数据
		api.POST("/user/sync", controllers.SyncUserData(db))
		api.GET("/user/data", controllers.GetUserData(db))

		// ---- 排行榜接口 ----
		// POST /api/leaderboard/submit -> 提交分数
		// GET  /api/leaderboard/top    -> 获取前50名
		api.POST("/leaderboard/submit", controllers.SubmitScore(db))
		api.GET("/leaderboard/top", controllers.GetTopLeaderboard(db))
	}
}
