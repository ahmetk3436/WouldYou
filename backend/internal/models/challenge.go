package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Challenge represents a "Would You Rather" challenge
type Challenge struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OptionA     string         `gorm:"size:500;not null" json:"option_a"`
	OptionB     string         `gorm:"size:500;not null" json:"option_b"`
	Category    string         `gorm:"size:50" json:"category"`
	VotesA      int            `gorm:"default:0" json:"votes_a"`
	VotesB      int            `gorm:"default:0" json:"votes_b"`
	IsDaily     bool           `gorm:"default:false" json:"is_daily"`
	DailyDate   time.Time      `gorm:"type:date" json:"daily_date"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// Vote represents a user's vote on a challenge
type Vote struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	ChallengeID uuid.UUID      `gorm:"type:uuid;not null;index" json:"challenge_id"`
	Choice      string         `gorm:"size:1;not null" json:"choice"` // "A" or "B"
	CreatedAt   time.Time      `json:"created_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// ChallengeStreak tracks user's voting streak
type ChallengeStreak struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	CurrentStreak  int            `gorm:"default:0" json:"current_streak"`
	LongestStreak  int            `gorm:"default:0" json:"longest_streak"`
	TotalVotes     int            `gorm:"default:0" json:"total_votes"`
	LastVoteDate   time.Time      `gorm:"type:date" json:"last_vote_date"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// Sample daily challenges
var DailyChallenges = []struct {
	OptionA  string
	OptionB  string
	Category string
}{
	{"Have unlimited money but no friends", "Have amazing friends but always be broke", "life"},
	{"Know when you'll die", "Know how you'll die", "deep"},
	{"Be able to fly", "Be able to read minds", "superpower"},
	{"Live in the past", "Live in the future", "time"},
	{"Never use social media again", "Never watch movies/TV again", "tech"},
	{"Have free WiFi everywhere", "Have free coffee everywhere", "daily"},
	{"Be famous but hated", "Be unknown but loved", "fame"},
	{"Always be cold", "Always be hot", "comfort"},
	{"Have a rewind button for life", "Have a pause button for life", "power"},
	{"Speak every language", "Play every instrument", "skill"},
}
