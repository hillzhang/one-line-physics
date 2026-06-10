package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"one-line-physics-backend/models"
)

// SubmitScore 提交玩家的最高分或最快通关记录到排行榜
func SubmitScore(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		openID := GetOpenID(c)
		if openID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing openid"})
			return
		}

		var req struct {
			AvatarUrl string `json:"avatarUrl"`
			Nickname  string `json:"nickname"`
			Score     int    `json:"score"`
			Mode      string `json:"mode"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Mode == "" {
			req.Mode = "main" // 默认模式为主线
		}

		if db != nil {
			var existingRecord models.Leaderboard
			result := db.Where("openid = ? AND mode = ?", openID, req.Mode).First(&existingRecord)
			
			if result.Error == nil {
				// 记录存在，只有当新分数更高时才更新
				if req.Score > existingRecord.Score {
					existingRecord.Score = req.Score
					existingRecord.Nickname = req.Nickname
					existingRecord.AvatarUrl = req.AvatarUrl
					db.Save(&existingRecord)
				}
			} else {
				// 记录不存在，创建新记录
				record := models.Leaderboard{
					OpenID:    openID,
					AvatarUrl: req.AvatarUrl,
					Nickname:  req.Nickname,
					Score:     req.Score,
					Mode:      req.Mode,
				}
				db.Create(&record)
			}
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	}
}

// GetTopLeaderboard 拉取前 50 名的排行榜数据
func GetTopLeaderboard(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		mode := c.Query("mode")
		if mode == "" {
			mode = "main"
		}

		var top []models.Leaderboard
		if db != nil {
			// 这里假设 score 是越高越好，如果是竞速则应该是 ASC
			db.Where("mode = ?", mode).Order("score DESC").Limit(50).Find(&top)
		} else {
			// Mock 测试数据
			top = []models.Leaderboard{
				{OpenID: "test1", Nickname: "Test Player 1", Score: 9999, Mode: mode},
				{OpenID: "test2", Nickname: "Test Player 2", Score: 8888, Mode: mode},
			}
		}

		c.JSON(http.StatusOK, top)
	}
}
