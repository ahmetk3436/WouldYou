package routes

import (
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/handlers"
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(
	app *fiber.App,
	cfg *config.Config,
	db *gorm.DB,
	authHandler *handlers.AuthHandler,
	healthHandler *handlers.HealthHandler,
	webhookHandler *handlers.WebhookHandler,
	moderationHandler *handlers.ModerationHandler,
	challengeHandler *handlers.ChallengeHandler,
	legalHandler *handlers.LegalHandler,
) {
	api := app.Group("/api")

	// Health
	api.Get("/health", healthHandler.Check)

	// Legal pages (public)
	api.Get("/privacy", legalHandler.PrivacyPolicy)
	api.Get("/terms", legalHandler.TermsOfService)

	// Auth (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/apple", authHandler.AppleSignIn) // Sign in with Apple (Guideline 4.8)

	// Auth (protected)
	protected := api.Group("", middleware.JWTProtected(cfg))
	protected.Post("/auth/logout", authHandler.Logout)
	protected.Delete("/auth/account", authHandler.DeleteAccount) // Account deletion (Guideline 5.1.1)

	// Moderation - User endpoints (protected)
	protected.Post("/reports", moderationHandler.CreateReport)     // Report content (Guideline 1.2)
	protected.Post("/blocks", moderationHandler.BlockUser)         // Block user (Guideline 1.2)
	protected.Delete("/blocks/:id", moderationHandler.UnblockUser) // Unblock user

	// Challenges - public with optional auth (daily + vote + category + random)
	optionalAuth := api.Group("/challenges", middleware.OptionalAuth(cfg))
	optionalAuth.Get("/daily", challengeHandler.GetDailyChallenge)
	optionalAuth.Post("/vote", challengeHandler.Vote)
	optionalAuth.Get("/random", challengeHandler.GetRandom)
	optionalAuth.Get("/category/:category", challengeHandler.GetByCategory)

	// Challenges - protected (stats + history require auth)
	protectedChallenges := protected.Group("/challenges")
	protectedChallenges.Get("/stats", challengeHandler.GetStats)
	protectedChallenges.Get("/history", challengeHandler.GetHistory)

	// Admin panel (protected + admin role check)
	admin := api.Group("/admin", middleware.JWTProtected(cfg), middleware.AdminOnly(db))
	admin.Get("/moderation/reports", moderationHandler.ListReports)
	admin.Put("/moderation/reports/:id", moderationHandler.ActionReport)

	// AI Question Generation endpoints
	admin.Post("/challenges/generate", challengeHandler.GenerateQuestions)
	admin.Post("/challenges/generate-all", challengeHandler.GenerateAllCategories)

	// Webhooks (verified by auth header, not JWT)
	webhooks := api.Group("/webhooks")
	webhooks.Post("/revenuecat", webhookHandler.HandleRevenueCat)
}
