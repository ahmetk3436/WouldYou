export interface Challenge {
  id: string;
  option_a: string;
  option_b: string;
  category: string;
  votes_a: number;
  votes_b: number;
  daily_date: string;
}

export interface ChallengeResult {
  challenge: Challenge;
  user_choice: string;
  percent_a: number;
  percent_b: number;
  total_votes: number;
}

export interface ChallengeStats {
  current_streak: number;
  longest_streak: number;
  total_votes: number;
}
