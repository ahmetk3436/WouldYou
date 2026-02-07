package handlers

import "github.com/gofiber/fiber/v2"

type LegalHandler struct{}

func NewLegalHandler() *LegalHandler {
	return &LegalHandler{}
}

func (h *LegalHandler) PrivacyPolicy(c *fiber.Ctx) error {
	html := `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy Policy - WouldYou</title><style>body{font-family:-apple-system,system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333;line-height:1.6}h1{color:#14B8A6}h2{color:#0D9488;margin-top:30px}</style></head><body><h1>Privacy Policy</h1><p><strong>Last updated:</strong> February 7, 2026</p><p>WouldYou ("we", "our", or "us") is committed to protecting your privacy.</p><h2>Information We Collect</h2><ul><li><strong>Account Information:</strong> Email and encrypted password.</li><li><strong>Voting Data:</strong> Your answers to Would You Rather questions.</li><li><strong>Social Data:</strong> Friend connections and challenge data.</li></ul><h2>How We Use Your Information</h2><ul><li>To provide Would You Rather questions and voting</li><li>To show trending poll results</li><li>To enable friend challenges</li></ul><h2>Data Storage & Security</h2><p>Stored securely with JWT authentication and encryption.</p><h2>Third-Party Services</h2><ul><li><strong>RevenueCat:</strong> Subscription management.</li><li><strong>Apple Sign In:</strong> Email and name only.</li></ul><h2>Data Deletion</h2><p>Delete your account and all data from Settings.</p><h2>Contact</h2><p>Email: <strong>ahmetk3436@gmail.com</strong></p></body></html>`
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(html)
}

func (h *LegalHandler) TermsOfService(c *fiber.Ctx) error {
	html := `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terms of Service - WouldYou</title><style>body{font-family:-apple-system,system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333;line-height:1.6}h1{color:#14B8A6}h2{color:#0D9488;margin-top:30px}</style></head><body><h1>Terms of Service</h1><p><strong>Last updated:</strong> February 7, 2026</p><h2>Use of Service</h2><p>WouldYou provides Would You Rather questions for entertainment. Must be 12+.</p><h2>Content Guidelines</h2><ul><li>User-submitted questions are moderated</li><li>No offensive or harmful content</li><li>No harassment</li></ul><h2>Subscriptions</h2><ul><li>Premium via Apple's App Store. Cancel anytime.</li></ul><h2>Limitation of Liability</h2><p>WouldYou is provided "as is". Questions are for entertainment only.</p><h2>Contact</h2><p>Email: <strong>ahmetk3436@gmail.com</strong></p></body></html>`
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(html)
}
