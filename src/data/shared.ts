import { ApplicationCommandOptionType, type ApplicationCommandOptionData } from "discord.js";

export const CHARACTER_AUTO_COMPLETE_NAME = "character";
export const characterAutoComplete: ApplicationCommandOptionData = {
  autocomplete: true,
  name: "character",
  description: "The character to be used in the playcard.",
  descriptionLocalizations: {
    "pt-BR": "O personagem a ser utilizado no playcard.",
  },
  nameLocalizations: {
    "pt-BR": "personagem",
  },
  type: ApplicationCommandOptionType.Number,
  required: true,
};
