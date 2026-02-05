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

func (h *ChallengeHandler) GetDailyChallenge(c *fiber.Ctx) error {
	challenge, err := h.service.GetDailyChallenge()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": true, "message": "Failed to get challenge",
		})
	}

	// Check if user voted
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	vote, _ := h.service.GetUserVote(userID, challenge.ID)
	userChoice := ""
	if vote != nil {
		userChoice = vote.Choice
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
		"percent_a":   percentA,
		"percent_b":   percentB,
		"total_votes": total,
	})
}

func (h *ChallengeHandler) Vote(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

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

	vote, err := h.service.Vote(userID, challengeID, req.Choice)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": true, "message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(vote)
}

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
