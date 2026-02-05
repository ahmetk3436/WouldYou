package services

import (
	"errors"
	"math/rand"
	"time"

	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChallengeService struct {
	db *gorm.DB
}

func NewChallengeService(db *gorm.DB) *ChallengeService {
	return &ChallengeService{db: db}
}

// GetDailyChallenge returns today's challenge
func (s *ChallengeService) GetDailyChallenge() (*models.Challenge, error) {
	today := time.Now().Truncate(24 * time.Hour)
	
	var challenge models.Challenge
	err := s.db.Where("is_daily = ? AND daily_date = ?", true, today).First(&challenge).Error
	if err == nil {
		return &challenge, nil
	}

	// Create today's challenge if not exists
	idx := rand.Intn(len(models.DailyChallenges))
	c := models.DailyChallenges[idx]
	
	challenge = models.Challenge{
		OptionA:   c.OptionA,
		OptionB:   c.OptionB,
		Category:  c.Category,
		IsDaily:   true,
		DailyDate: today,
	}
	
	if err := s.db.Create(&challenge).Error; err != nil {
		return nil, err
	}
	
	return &challenge, nil
}

// Vote records a user's vote
func (s *ChallengeService) Vote(userID, challengeID uuid.UUID, choice string) (*models.Vote, error) {
	if choice != "A" && choice != "B" {
		return nil, errors.New("invalid choice, must be A or B")
	}

	// Check if already voted
	var existing models.Vote
	if err := s.db.Where("user_id = ? AND challenge_id = ?", userID, challengeID).First(&existing).Error; err == nil {
		return nil, errors.New("already voted on this challenge")
	}

	vote := &models.Vote{
		UserID:      userID,
		ChallengeID: challengeID,
		Choice:      choice,
	}

	if err := s.db.Create(vote).Error; err != nil {
		return nil, err
	}

	// Update vote counts
	if choice == "A" {
		s.db.Model(&models.Challenge{}).Where("id = ?", challengeID).Update("votes_a", gorm.Expr("votes_a + 1"))
	} else {
		s.db.Model(&models.Challenge{}).Where("id = ?", challengeID).Update("votes_b", gorm.Expr("votes_b + 1"))
	}

	// Update streak
	s.updateStreak(userID)

	return vote, nil
}

// GetUserVote returns user's vote on a challenge
func (s *ChallengeService) GetUserVote(userID, challengeID uuid.UUID) (*models.Vote, error) {
	var vote models.Vote
	if err := s.db.Where("user_id = ? AND challenge_id = ?", userID, challengeID).First(&vote).Error; err != nil {
		return nil, err
	}
	return &vote, nil
}

// updateStreak updates user's voting streak
func (s *ChallengeService) updateStreak(userID uuid.UUID) {
	today := time.Now().Truncate(24 * time.Hour)
	
	var streak models.ChallengeStreak
	if err := s.db.Where("user_id = ?", userID).First(&streak).Error; err != nil {
		streak = models.ChallengeStreak{
			UserID:        userID,
			CurrentStreak: 1,
			LongestStreak: 1,
			TotalVotes:    1,
			LastVoteDate:  today,
		}
		s.db.Create(&streak)
		return
	}

	yesterday := today.AddDate(0, 0, -1)
	streak.TotalVotes++

	if streak.LastVoteDate.Equal(yesterday) {
		streak.CurrentStreak++
	} else if !streak.LastVoteDate.Equal(today) {
		streak.CurrentStreak = 1
	}

	if streak.CurrentStreak > streak.LongestStreak {
		streak.LongestStreak = streak.CurrentStreak
	}
	streak.LastVoteDate = today

	s.db.Save(&streak)
}

// GetStats returns user's voting stats
func (s *ChallengeService) GetStats(userID uuid.UUID) (map[string]interface{}, error) {
	var streak models.ChallengeStreak
	s.db.Where("user_id = ?", userID).First(&streak)

	return map[string]interface{}{
		"current_streak": streak.CurrentStreak,
		"longest_streak": streak.LongestStreak,
		"total_votes":    streak.TotalVotes,
	}, nil
}

// GetChallengeHistory returns past challenges with user's votes
func (s *ChallengeService) GetChallengeHistory(userID uuid.UUID, limit int) ([]map[string]interface{}, error) {
	var challenges []models.Challenge
	s.db.Where("is_daily = ?", true).Order("daily_date DESC").Limit(limit).Find(&challenges)

	result := make([]map[string]interface{}, 0)
	for _, c := range challenges {
		var vote models.Vote
		s.db.Where("user_id = ? AND challenge_id = ?", userID, c.ID).First(&vote)
		
		total := c.VotesA + c.VotesB
		percentA := 0
		percentB := 0
		if total > 0 {
			percentA = (c.VotesA * 100) / total
			percentB = (c.VotesB * 100) / total
		}

		result = append(result, map[string]interface{}{
			"challenge":   c,
			"user_choice": vote.Choice,
			"percent_a":   percentA,
			"percent_b":   percentB,
			"total_votes": total,
		})
	}

	return result, nil
}
