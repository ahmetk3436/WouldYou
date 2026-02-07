package dto

// ChallengeResponse is the API response for a single challenge
type ChallengeResponse struct {
	ID         string  `json:"id"`
	OptionA    string  `json:"option_a"`
	OptionB    string  `json:"option_b"`
	Category   string  `json:"category"`
	VotesA     int     `json:"votes_a"`
	VotesB     int     `json:"votes_b"`
	IsDaily    bool    `json:"is_daily"`
	DailyDate  string  `json:"daily_date"`
	UserVote   *string `json:"user_vote"`
	PercentA   int     `json:"percent_a"`
	PercentB   int     `json:"percent_b"`
	TotalVotes int     `json:"total_votes"`
}

// ChallengeListResponse wraps a list of challenge responses
type ChallengeListResponse struct {
	Data  []ChallengeResponse `json:"data"`
	Total int                 `json:"total"`
}
