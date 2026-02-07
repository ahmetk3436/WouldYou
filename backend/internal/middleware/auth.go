package middleware

import (
	"strings"

	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/models"
	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func JWTProtected(cfg *config.Config) fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(cfg.JWTSecret)},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusUnauthorized).JSON(dto.ErrorResponse{
				Error:   true,
				Message: "Unauthorized: invalid or expired token",
			})
		},
	})
}

// OptionalAuth extracts user or guest identity without requiring authentication.
// Sets "userID" (uuid.UUID) and/or "guestID" (string) in Locals.
func OptionalAuth(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// No auth at all - anonymous access
			c.Locals("userID", uuid.Nil)
			c.Locals("guestID", "")
			return c.Next()
		}

		// Check for Guest auth: "Guest <device-id>"
		if strings.HasPrefix(authHeader, "Guest ") {
			guestID := strings.TrimPrefix(authHeader, "Guest ")
			c.Locals("userID", uuid.Nil)
			c.Locals("guestID", guestID)
			return c.Next()
		}

		// Try Bearer JWT
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				return []byte(cfg.JWTSecret), nil
			})
			if err == nil && token.Valid {
				claims := token.Claims.(jwt.MapClaims)
				sub, ok := claims["sub"].(string)
				if ok {
					userID, parseErr := uuid.Parse(sub)
					if parseErr == nil {
						c.Locals("user", token)
						c.Locals("userID", userID)
						c.Locals("guestID", "")
						return c.Next()
					}
				}
			}
		}

		// Invalid token - treat as anonymous
		c.Locals("userID", uuid.Nil)
		c.Locals("guestID", "")
		return c.Next()
	}
}

// AdminOnly middleware checks that the authenticated user has admin role.
// Must be used after JWTProtected.
func AdminOnly(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userToken := c.Locals("user").(*jwt.Token)
		claims := userToken.Claims.(jwt.MapClaims)
		userIDStr, ok := claims["sub"].(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error:   true,
				Message: "Admin access required",
			})
		}

		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error:   true,
				Message: "Admin access required",
			})
		}

		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error:   true,
				Message: "Admin access required",
			})
		}

		if user.Role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(dto.ErrorResponse{
				Error:   true,
				Message: "Admin access required",
			})
		}

		return c.Next()
	}
}
