export const TEXT_INPUT_CUSTOM_IDS = {
  name: "name",
  appearance: "appearance",
  imageUrl: "imageUrl",
  backstory: "backstory",
  personality: "personality",
} as const;

export const BUTTON_CUSTOM_IDS = {
  appearance: "appearance",
  backstory: "backstory",
  personality: "personality",
} as const;
export const SELECT_CUSTOM_IDS = {
  editCharacter: "editCharacter",
} as const;

export const MAX_CHARACTER_LEVEL = 100 as const;
export const LEVELING_QUOTIENT = 1.3735 as const;
export const MIN_MAX_EXP_PER_MESSAGE = [2.5, 5.0] as const;
export const EDIT_MESSAGE_EMOJI = "📝" as const;
export const DELETE_MESSAGE_EMOJI = "❌" as const;
export const XP_COOLDOWN_MINUTES = 30 as const;

export const EDITABLE_PROFILE_FIELDS = [
  "name",
  "age",
  "imageUrl",
  "birthday",
  "backstory",
  "personality",
  "appearance",
  "race",
  "gender",
  "pronouns",
  "title",
  "embedColor",
] as const;

export const LONG_PROFILE_FIELDS = ["appearance", "backstory", "personality"] as const;

export const DATE_PROFILE_FIELDS = ["createdAt", "lastPostAt"] as const;

export const ALL_PROFILE_FIELDS = [
  "backstory",
  "personality",
  "name",
  "age",
  "imageUrl",
  "birthday",
  "appearance",
  "race",
  "gender",
  "pronouns",
  "title",
  "embedColor",
  "createdAt",
  "lastPostAt",
  "id",
  "authorId",
  "level",
  "exp",
] as const;
