package controllers

import (
	"net/http"
	"strings"

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
				// 记录存在，更新昵称和头像
				existingRecord.Nickname = req.Nickname
				existingRecord.AvatarUrl = req.AvatarUrl
				
				// 根据模式判断是否覆盖分数
				if strings.HasPrefix(req.Mode, "daily") {
					// 擂台模式（时间竞速）：时间越短越好。如果是0则表示没成绩，也可以覆盖
					if existingRecord.Score == 0 || req.Score < existingRecord.Score {
						existingRecord.Score = req.Score
					}
				} else {
					// 主线模式：分数越大越好
					if req.Score > existingRecord.Score {
						existingRecord.Score = req.Score
					}
				}
				db.Save(&existingRecord)
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
			if strings.HasPrefix(mode, "daily") {
				if len(mode) > 6 {
					dateStr := mode[6:] // 提取 YYYY-MM-DD
					// 兼容旧的 mode="daily" 且日期匹配的数据，以及新的 mode="daily_YYYY-MM-DD" 的数据
					// 擂台竞速：从小到大排序
					db.Where("mode = ? OR (mode = 'daily' AND DATE(created_at) = ?)", mode, dateStr).Order("score ASC").Limit(50).Find(&top)
				} else {
					db.Where("mode = ?", mode).Order("score ASC").Limit(50).Find(&top)
				}
			} else {
				// 主线闯关：从大到小排序
				db.Where("mode = ?", mode).Order("score DESC").Limit(50).Find(&top)
			}
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
