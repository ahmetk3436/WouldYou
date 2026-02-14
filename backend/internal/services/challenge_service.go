package services

import (
	"errors"
	"log"
	"math/rand"
	"time"

	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChallengeService struct {
	db                *gorm.DB
	questionGenerator *QuestionGeneratorService
}

func NewChallengeService(db *gorm.DB, qg *QuestionGeneratorService) *ChallengeService {
	return &ChallengeService{db: db, questionGenerator: qg}
}

// GetDailyChallenge returns today's challenge, creating one with rotation if needed
func (s *ChallengeService) GetDailyChallenge() (*models.Challenge, error) {
	today := time.Now().Truncate(24 * time.Hour)

	var challenge models.Challenge
	err := s.db.Where("is_daily = ? AND daily_date = ?", true, today).First(&challenge).Error
	if err == nil {
		return &challenge, nil
	}

	// Get recently used challenges (last 30 days) to avoid repeats
	var recentChallenges []models.Challenge
	thirtyDaysAgo := today.AddDate(0, 0, -30)
	s.db.Where("is_daily = ? AND daily_date > ?", true, thirtyDaysAgo).Find(&recentChallenges)

	usedOptions := make(map[string]bool)
	for _, rc := range recentChallenges {
		usedOptions[rc.OptionA+"|"+rc.OptionB] = true
	}

	// Filter pool to unused challenges
	available := make([]int, 0)
	for i, c := range models.DailyChallenges {
		key := c.OptionA + "|" + c.OptionB
		if !usedOptions[key] {
			available = append(available, i)
		}
	}

	// If all used, reset
	if len(available) == 0 {
		for i := range models.DailyChallenges {
			available = append(available, i)
		}
	}

	idx := available[rand.Intn(len(available))]
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

// GetChallengesByCategory returns challenges filtered by category
func (s *ChallengeService) GetChallengesByCategory(category string, userID uuid.UUID, limit int) ([]map[string]interface{}, error) {
	// Ensure challenges exist for this category
	s.ensureCategoryChallenges(category)

	var challenges []models.Challenge
	query := s.db.Where("category = ?", category).Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	query.Find(&challenges)

	// If fewer than 5 challenges and generator is available, generate more
	if len(challenges) < 5 && s.questionGenerator != nil && s.questionGenerator.IsAvailable() {
		log.Printf("Low challenge count for category %s (%d), generating more...", category, len(challenges))
		_, genErr := s.questionGenerator.GenerateBatch(category, 10)
		if genErr != nil {
			log.Printf("Failed to generate challenges for category %s: %v", category, genErr)
		} else {
			// Re-query with the new challenges included
			challenges = nil
			query = s.db.Where("category = ?", category).Order("created_at DESC")
			if limit > 0 {
				query = query.Limit(limit)
			}
			query.Find(&challenges)
		}
	}

	result := make([]map[string]interface{}, 0)
	for _, ch := range challenges {
		total := ch.VotesA + ch.VotesB
		percentA := 0
		percentB := 0
		if total > 0 {
			percentA = (ch.VotesA * 100) / total
			percentB = (ch.VotesB * 100) / total
		}

		userChoice := ""
		if userID != uuid.Nil {
			var vote models.Vote
			if err := s.db.Where("user_id = ? AND challenge_id = ?", userID, ch.ID).First(&vote).Error; err == nil {
				userChoice = vote.Choice
			}
		}

		result = append(result, map[string]interface{}{
			"challenge":   ch,
			"user_choice": userChoice,
			"percent_a":   percentA,
			"percent_b":   percentB,
			"total_votes": total,
		})
	}

	return result, nil
}

// ensureCategoryChallenges creates non-daily challenges for a category if they don't exist yet
func (s *ChallengeService) ensureCategoryChallenges(category string) {
	var count int64
	s.db.Model(&models.Challenge{}).Where("category = ? AND is_daily = ?", category, false).Count(&count)
	if count > 0 {
		return
	}

	for _, c := range models.DailyChallenges {
		if c.Category == category {
			ch := models.Challenge{
				OptionA:  c.OptionA,
				OptionB:  c.OptionB,
				Category: c.Category,
				IsDaily:  false,
			}
			s.db.Create(&ch)
		}
	}
}

// GetRandomChallenge returns a random non-daily challenge the user hasn't voted on
func (s *ChallengeService) GetRandomChallenge(userID uuid.UUID) (*models.Challenge, error) {
	// Ensure some non-daily challenges exist
	for _, cat := range []string{"life", "deep", "superpower", "funny", "love", "tech"} {
		s.ensureCategoryChallenges(cat)
	}

	var challenge models.Challenge
	subQuery := s.db.Model(&models.Vote{}).Select("challenge_id").Where("user_id = ?", userID)

	err := s.db.Where("is_daily = ? AND id NOT IN (?)", false, subQuery).
		Order("RANDOM()").
		First(&challenge).Error

	if err == nil {
		return &challenge, nil
	}

	// Check total non-daily challenge count
	var totalCount int64
	s.db.Model(&models.Challenge{}).Where("is_daily = ?", false).Count(&totalCount)

	if totalCount == 0 {
		// No challenges at all - try to generate some
		if s.questionGenerator != nil && s.questionGenerator.IsAvailable() {
			log.Println("No challenges found, generating via GLM-5...")
			_, genErr := s.questionGenerator.GenerateBatch("general", 10)
			if genErr != nil {
				log.Printf("Failed to generate challenges: %v", genErr)
				return nil, errors.New("no challenges available and generation failed")
			}
			// Try again after generation
			err = s.db.Where("is_daily = ? AND id NOT IN (?)", false, subQuery).
				Order("RANDOM()").
				First(&challenge).Error
			if err == nil {
				return &challenge, nil
			}
		}
		return nil, errors.New("no challenges available")
	}

	// User has voted on all challenges - return any random one
	err = s.db.Where("is_daily = ?", false).Order("RANDOM()").First(&challenge).Error
	if err != nil {
		return nil, errors.New("no challenges available")
	}

	return &challenge, nil
}

// Vote records a user's or guest's vote
func (s *ChallengeService) Vote(userID uuid.UUID, guestID string, challengeID uuid.UUID, choice string) (*models.Vote, error) {
	if choice != "A" && choice != "B" {
		return nil, errors.New("invalid choice, must be A or B")
	}

	// Check guest daily limit
	if userID == uuid.Nil && guestID != "" {
		count := s.GetGuestVoteCount(guestID, time.Now())
		if count >= 3 {
			return nil, errors.New("Daily free limit reached. Sign up for unlimited votes!")
		}

		// Check if guest already voted on this challenge
		var existing models.Vote
		if err := s.db.Where("guest_id = ? AND challenge_id = ?", guestID, challengeID).First(&existing).Error; err == nil {
			return nil, errors.New("already voted on this challenge")
		}
	} else if userID != uuid.Nil {
		// Check if authenticated user already voted
		var existing models.Vote
		if err := s.db.Where("user_id = ? AND challenge_id = ?", userID, challengeID).First(&existing).Error; err == nil {
			return nil, errors.New("already voted on this challenge")
		}
	} else {
		return nil, errors.New("authentication required")
	}

	vote := &models.Vote{
		UserID:      userID,
		GuestID:     guestID,
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

	// Update streak for authenticated users
	if userID != uuid.Nil {
		s.updateStreak(userID)
	}

	return vote, nil
}

// GetGuestVoteCount returns the number of votes a guest made on a given date
func (s *ChallengeService) GetGuestVoteCount(guestID string, date time.Time) int {
	startOfDay := date.Truncate(24 * time.Hour)
	endOfDay := startOfDay.Add(24 * time.Hour)

	var count int64
	s.db.Model(&models.Vote{}).
		Where("guest_id = ? AND created_at >= ? AND created_at < ?", guestID, startOfDay, endOfDay).
		Count(&count)

	return int(count)
}

// GetUserVote returns user's vote on a challenge
func (s *ChallengeService) GetUserVote(userID uuid.UUID, challengeID uuid.UUID) (*models.Vote, error) {
	var vote models.Vote
	if err := s.db.Where("user_id = ? AND challenge_id = ?", userID, challengeID).First(&vote).Error; err != nil {
		return nil, err
	}
	return &vote, nil
}

// GetGuestVote returns guest's vote on a challenge
func (s *ChallengeService) GetGuestVote(guestID string, challengeID uuid.UUID) (*models.Vote, error) {
	var vote models.Vote
	if err := s.db.Where("guest_id = ? AND challenge_id = ?", guestID, challengeID).First(&vote).Error; err != nil {
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

// GetCategories returns all available categories
func (s *ChallengeService) GetCategories() ([]string, error) {
	var categories []string

	err := s.db.Model(&models.Challenge{}).
		Distinct("category").
		Pluck("category", &categories).Error

	if err != nil {
		return nil, err
	}

	if len(categories) == 0 {
		categories = []string{"life", "deep", "superpower", "funny", "love", "tech"}
	}

	return categories, nil
}

// EnsureMinimumChallenges checks and generates challenges if below minimum
func (s *ChallengeService) EnsureMinimumChallenges() error {
	if s.questionGenerator == nil || !s.questionGenerator.IsAvailable() {
		return nil
	}

	categories := []string{"life", "deep", "superpower", "funny", "love", "tech"}
	minPerCategory := 10

	for _, category := range categories {
		var count int64
		s.db.Model(&models.Challenge{}).Where("category = ?", category).Count(&count)

		if count < int64(minPerCategory) {
			needed := minPerCategory - int(count)
			log.Printf("Category %s has %d challenges, generating %d more", category, count, needed)

			_, err := s.questionGenerator.GenerateBatch(category, needed)
			if err != nil {
				log.Printf("Failed to generate for %s: %v", category, err)
			}
		}
	}

	return nil
}
