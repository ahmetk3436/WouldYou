package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/wouldyou/backend/internal/models"

	"gorm.io/gorm"
)

// QuestionGeneratorService handles AI-powered question generation via GLM-5
type QuestionGeneratorService struct {
	db     *gorm.DB
	apiURL string
	apiKey string
	model  string
	client *http.Client
}

// GLMRequest represents the request body for GLM-5 API
type GLMRequest struct {
	Model       string       `json:"model"`
	Messages    []GLMMessage `json:"messages"`
	Temperature float64      `json:"temperature"`
	MaxTokens   int          `json:"max_tokens"`
}

// GLMMessage represents a message in the GLM request
type GLMMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GLMResponse represents the response from GLM-5 API
type GLMResponse struct {
	ID      string `json:"id"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	// Alternative response format (some APIs use this)
	Content []struct {
		Text string `json:"text"`
	} `json:"content,omitempty"`
}

// GeneratedQuestion represents a parsed question from AI
type GeneratedQuestion struct {
	OptionA  string `json:"option_a"`
	OptionB  string `json:"option_b"`
	Category string `json:"category"`
}

// NewQuestionGeneratorService creates a new question generator service
func NewQuestionGeneratorService(db *gorm.DB, cfg *config.Config) *QuestionGeneratorService {
	return &QuestionGeneratorService{
		db:     db,
		apiURL: cfg.GLMApiURL,
		apiKey: cfg.GLMApiKey,
		model:  cfg.GLMModel,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// IsAvailable checks if the GLM API is configured and available
func (s *QuestionGeneratorService) IsAvailable() bool {
	return s.apiKey != ""
}

// GenerateBatch generates multiple questions for a given category
func (s *QuestionGeneratorService) GenerateBatch(category string, count int) ([]models.Challenge, error) {
	if category == "" {
		category = "general"
	}
	if count <= 0 {
		count = 10
	}
	if count > 50 {
		count = 50
	}

	if s.apiKey == "" {
		return nil, fmt.Errorf("GLM API key not configured")
	}

	systemPrompt := `You are a creative question generator for a "Would You Rather" game. Generate fun, engaging, and thought-provoking questions that make people think and laugh.

Rules:
1. Questions should be family-friendly but interesting
2. Both options should be equally difficult to choose between
3. Be creative and avoid clichés
4. Include a mix of funny, deep, and silly questions
5. Return ONLY valid JSON array, no markdown, no explanation`

	userPrompt := fmt.Sprintf(`Generate exactly %d "Would You Rather" questions for the category: "%s".

Return a JSON array with this exact format:
[
  {
    "option_a": "First option text here",
    "option_b": "Second option text here",
    "category": "%s"
  }
]

Make sure each question is unique and creative. Return ONLY the JSON array, nothing else.`, count, category, category)

	glmReq := GLMRequest{
		Model: s.model,
		Messages: []GLMMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.9,
		MaxTokens:   4096,
	}

	reqBody, err := json.Marshal(glmReq)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", s.apiURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.apiKey))

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call GLM API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("GLM API error: status=%d, body=%s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("GLM API returned status %d: %s", resp.StatusCode, string(body))
	}

	var glmResp GLMResponse
	if err := json.Unmarshal(body, &glmResp); err != nil {
		return nil, fmt.Errorf("failed to parse GLM response: %w", err)
	}

	var content string
	if len(glmResp.Choices) > 0 {
		content = glmResp.Choices[0].Message.Content
	} else if len(glmResp.Content) > 0 {
		content = glmResp.Content[0].Text
	} else {
		return nil, fmt.Errorf("no content in GLM response")
	}

	// Clean up the content (remove markdown code blocks if present)
	content = strings.TrimSpace(content)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var generatedQuestions []GeneratedQuestion
	if err := json.Unmarshal([]byte(content), &generatedQuestions); err != nil {
		log.Printf("Failed to parse generated questions: %v, content: %s", err, content)
		return nil, fmt.Errorf("failed to parse generated questions: %w", err)
	}

	var challenges []models.Challenge
	for i, q := range generatedQuestions {
		if q.OptionA == "" || q.OptionB == "" {
			log.Printf("Skipping invalid question %d: option_a=%s, option_b=%s", i, q.OptionA, q.OptionB)
			continue
		}

		if q.Category == "" {
			q.Category = category
		}

		challenge := models.Challenge{
			OptionA:  strings.TrimSpace(q.OptionA),
			OptionB:  strings.TrimSpace(q.OptionB),
			Category: strings.ToLower(strings.TrimSpace(q.Category)),
			IsDaily:  false,
		}

		challenges = append(challenges, challenge)
	}

	if len(challenges) == 0 {
		return nil, fmt.Errorf("no valid questions generated")
	}

	if err := s.db.Create(&challenges).Error; err != nil {
		return nil, fmt.Errorf("failed to save challenges to database: %w", err)
	}

	log.Printf("Successfully generated and saved %d questions for category: %s", len(challenges), category)
	return challenges, nil
}

// GenerateForAllCategories generates questions for all standard categories
func (s *QuestionGeneratorService) GenerateForAllCategories(countPerCategory int) (map[string][]models.Challenge, error) {
	categories := []string{"funny", "deep", "food", "adventure", "impossible", "would", "tech", "lifestyle"}

	results := make(map[string][]models.Challenge)
	var errors []error

	for _, category := range categories {
		challenges, err := s.GenerateBatch(category, countPerCategory)
		if err != nil {
			log.Printf("Failed to generate for category %s: %v", category, err)
			errors = append(errors, fmt.Errorf("%s: %w", category, err))
			continue
		}
		results[category] = challenges
	}

	if len(errors) > 0 && len(results) == 0 {
		return nil, fmt.Errorf("failed to generate for all categories: %v", errors)
	}

	return results, nil
}
