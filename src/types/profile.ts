export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  selected_avatar: string;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Reward = {
  id: string;
  user_id: string;
  reward_type: string;
  title: string;
  description: string | null;
  points_earned: number;
  earned_at: string;
};

export const AVATAR_OPTIONS = [
  { id: 'default', emoji: '😊', label: 'Happy' },
  { id: 'cool', emoji: '😎', label: 'Cool' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'wizard', emoji: '🧙', label: 'Wizard' },
  { id: 'alien', emoji: '👽', label: 'Alien' },
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'diamond', emoji: '💎', label: 'Diamond' },
];
