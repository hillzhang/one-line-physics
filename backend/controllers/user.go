package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"one-line-physics-backend/models"
)

// GetOpenID 提取微信云托管自动注入的 OpenID
func GetOpenID(c *gin.Context) string {
	openID := c.GetHeader("X-WX-OPENID")
	if openID == "" {
		openID = c.Query("openid") // 本地测试环境的回退方案
	}
	return openID
}

// SyncUserData 将玩家本地存档覆盖到云端
func SyncUserData(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		openID := GetOpenID(c)
		if openID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing X-WX-OPENID header"})
			return
		}

		var req models.User
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		req.OpenID = openID
		req.UpdatedAt = time.Now()

		if db != nil {
			var existing models.User
			err := db.Where("openid = ?", openID).First(&existing).Error
			if err == nil {
				// 记录存在，更新字段
				existing.Coins = req.Coins
				existing.Level = req.Level
				existing.PropsJSON = req.PropsJSON
				existing.UnlockedJSON = req.UnlockedJSON
				existing.EquippedJSON = req.EquippedJSON
				existing.SettingsJSON = req.SettingsJSON
				existing.CheckInDate = req.CheckInDate
				existing.CheckInStreak = req.CheckInStreak
				existing.UpdatedAt = req.UpdatedAt
				db.Save(&existing)
			} else {
				// 记录不存在，创建新记录
				db.Create(&req)
			}
		}
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	}
}

// GetUserData 获取玩家的云端存档数据
func GetUserData(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		openID := GetOpenID(c)
		if openID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing openid"})
			return
		}

		var user models.User
		if db != nil {
			result := db.Where("openid = ?", openID).First(&user)
			if result.Error != nil {
				if result.Error == gorm.ErrRecordNotFound {
					c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": "db query error"})
				return
			}
		} else {
			// 如果没有连接数据库，返回测试假数据
			user = models.User{OpenID: openID, Coins: 100, Level: 1}
		}

		c.JSON(http.StatusOK, user)
	}
}
