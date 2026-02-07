package handlers

import (
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type ChallengeHandler struct {
	service *services.ChallengeService
}

func NewChallengeHandler(service *services.ChallengeService) *ChallengeHandler {
	return &ChallengeHandler{service: service}
}

// GetDailyChallenge supports both authenticated and guest/anonymous access via OptionalAuth
func (h *ChallengeHandler) GetDailyChallenge(c *fiber.Ctx) error {
	challenge, err := h.service.GetDailyChallenge()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": true, "message": "Failed to get challenge",
		})
	}

	userID, guestID := extractIdentity(c)

	userChoice := ""
	if userID != uuid.Nil {
		vote, _ := h.service.GetUserVote(userID, challenge.ID)
		if vote != nil {
			userChoice = vote.Choice
		}
	} else if guestID != "" {
		vote, _ := h.service.GetGuestVote(guestID, challenge.ID)
		if vote != nil {
			userChoice = vote.Choice
		}
	}

	total := challenge.VotesA + challenge.VotesB
	percentA, percentB := 0, 0
	if total > 0 {
		percentA = (challenge.VotesA * 100) / total
		percentB = (challenge.VotesB * 100) / total
	}

	return c.JSON(fiber.Map{
		"challenge":   challenge,
		"user_choice": userChoice,
		"user_voted":  userChoice != "",
		"percent_a":   percentA,
		"percent_b":   percentB,
		"total_votes": total,
	})
}

// Vote supports both authenticated users and guests via OptionalAuth
func (h *ChallengeHandler) Vote(c *fiber.Ctx) error {
	userID, guestID := extractIdentity(c)

	if userID == uuid.Nil && guestID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": true, "message": "Authentication required. Sign up or use guest mode.",
		})
	}

	var req struct {
		ChallengeID string `json:"challenge_id"`
		Choice      string `json:"choice"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": true, "message": "Invalid request body",
		})
	}

	challengeID, err := uuid.Parse(req.ChallengeID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": true, "message": "Invalid challenge ID",
		})
	}

	vote, err := h.service.Vote(userID, guestID, challengeID, req.Choice)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": true, "message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(vote)
}

// GetStats requires authenticated user
func (h *ChallengeHandler) GetStats(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	stats, err := h.service.GetStats(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": true, "message": "Failed to get stats",
		})
	}

	return c.JSON(stats)
}

// GetHistory requires authenticated user
func (h *ChallengeHandler) GetHistory(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	history, err := h.service.GetChallengeHistory(userID, 20)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": true, "message": "Failed to get history",
		})
	}

	return c.JSON(fiber.Map{"data": history})
}

// GetRandom returns a random challenge the user hasn't voted on
func (h *ChallengeHandler) GetRandom(c *fiber.Ctx) error {
	userID, _ := extractIdentity(c)

	challenge, err := h.service.GetRandomChallenge(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": true, "message": "No challenges available",
		})
	}

	total := challenge.VotesA + challenge.VotesB
	percentA, percentB := 0, 0
	if total > 0 {
		percentA = (challenge.VotesA * 100) / total
		percentB = (challenge.VotesB * 100) / total
	}

	return c.JSON(fiber.Map{
		"challenge":   challenge,
		"user_choice": "",
		"percent_a":   percentA,
		"percent_b":   percentB,
		"total_votes": total,
	})
}

// GetByCategory returns challenges for a specific category
func (h *ChallengeHandler) GetByCategory(c *fiber.Ctx) error {
	category := c.Params("category")
	if category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": true, "message": "Category is required",
		})
	}

	userID, _ := extractIdentity(c)

	challenges, err := h.service.GetChallengesByCategory(category, userID, 20)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": true, "message": "Failed to get challenges",
		})
	}

	return c.JSON(fiber.Map{"data": challenges, "total": len(challenges)})
}

// extractIdentity gets userID and guestID from OptionalAuth middleware locals
func extractIdentity(c *fiber.Ctx) (uuid.UUID, string) {
	userID := uuid.Nil
	guestID := ""

	if uid, ok := c.Locals("userID").(uuid.UUID); ok {
		userID = uid
	} else if token, ok := c.Locals("user").(*jwt.Token); ok {
		claims := token.Claims.(jwt.MapClaims)
		if sub, ok := claims["sub"].(string); ok {
			userID, _ = uuid.Parse(sub)
		}
	}

	if gid, ok := c.Locals("guestID").(string); ok {
		guestID = gid
	}

	return userID, guestID
}
