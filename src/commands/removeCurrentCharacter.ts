import type { ChatInputCommandInteraction } from "discord.js";

import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class RemoveCurrentCharacter extends BaseCommand {
  public constructor() {
    super({
      name: "remove-current-character",
      nameLocalizations: {
        "pt-BR": "remover-personagem-atual",
      },
      description: "Remove the current character to be used in the playcard.",
      descriptionLocalizations: {
        "pt-BR": "Remove o personagem atual a ser utilizado no playcard.",
      },
      options: [],
    });
  }

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const user = await UserService.getOrCreateUser(interaction.user.id, true);
    const translate = user.getTranslateFunction();

    if (!user.currentCharacterId) {
      await interaction.editReply({
        content: translate("noCurrentCharacter"),
      });
    }

    user.currentCharacterId = null;
    await UserService.updateUser(user);
    await interaction.editReply({
      content: translate("currentCharacterUnset"),
    });
  }
}
