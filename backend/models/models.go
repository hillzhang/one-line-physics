package models

import (
	"time"
)

type User struct {
	OpenID       string    `gorm:"primaryKey;column:openid;type:varchar(100)" json:"openid"`
	Coins        int       `gorm:"column:coins;default:0" json:"coins"`
	Level        int       `gorm:"column:level;default:1" json:"level"`
	PropsJSON     string    `gorm:"column:props_json;type:text" json:"props"`
	UnlockedJSON  string    `gorm:"column:unlocked_json;type:text" json:"unlocked"`
	EquippedJSON  string    `gorm:"column:equipped_json;type:text" json:"equipped"`
	SettingsJSON  string    `gorm:"column:settings_json;type:text" json:"settings"`
	CheckInDate   string    `gorm:"column:check_in_date;type:varchar(50)" json:"checkInDate"`
	CheckInStreak int       `gorm:"column:check_in_streak;default:0" json:"checkInStreak"`
	AdDate        string    `gorm:"column:ad_date;type:varchar(50)" json:"adDate"`
	AdCount       int       `gorm:"column:ad_count;default:0" json:"adCount"`
	GameClubDate  string    `gorm:"column:game_club_date;type:varchar(50)" json:"gameClubDate"`
	CreatedAt     time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

type Leaderboard struct {
	ID        uint      `gorm:"primaryKey"`
	OpenID    string    `gorm:"index;column:openid;type:varchar(100)" json:"openid"`
	AvatarUrl string    `gorm:"type:varchar(255)" json:"avatarUrl"`
	Nickname  string    `gorm:"type:varchar(100)" json:"nickname"`
	Score     int       `gorm:"index;column:score" json:"score"`
	Mode      string    `gorm:"index;type:varchar(50)" json:"mode"` // "main" or "daily"
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
