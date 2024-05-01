import type { CommandInteraction, CacheType } from "discord.js";
import { BaseCommand } from "./baseCommand";
import CharacterService from "@/services/characterService";

export default class TopCommand extends BaseCommand {
  public constructor() {
    super({
      name: "top",
      description: "Shows the characters with the most points.",
      descriptionLocalizations: {
        "pt-BR": "Mostra os personagens com mais pontos.",
      },
      nameLocalizations: {
        "pt-BR": "top",
      },
      options: [],
    });
  }

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const characters = await CharacterService.getCharacters({ limit: 10 });
    const topCharacters = characters.map(
      (character, index) => `${index + 1}. ${character.name} - ${character.level} | ${character.posts.length} posts`
    );
    const response = ["# ✨ Character Vault Top 10", "\n"];
    void interaction.editReply([...response, ...topCharacters].join("\n"));
  }
}
