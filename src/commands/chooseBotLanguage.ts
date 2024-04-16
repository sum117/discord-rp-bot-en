import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import enUS from "../locales/en-US.json";
import ptBr from "../locales/pt-BR.json";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class ChooseBotLanguageComand extends BaseCommand {
  public constructor() {
    super({
      name: enUS.chooseBotLanguageCommandName,
      nameLocalizations: { "pt-BR": ptBr.chooseBotLanguageCommandName },
      description: enUS.chooseBotLanguageCommandDescription,
      descriptionLocalizations: {
        "pt-BR": ptBr.chooseBotLanguageCommandDescription,
      },
      options: [
        {
          choices: [
            { name: "English", value: "en-US" },
            { name: "Português", value: "pt-BR" },
          ],
          type: ApplicationCommandOptionType.String,
          name: enUS.chooseBotLanguageCommandOptionName,
          nameLocalizations: {
            "pt-BR": ptBr.chooseBotLanguageCommandOptionName,
          },
          description: enUS.chooseBotLanguageCommandOptionDescription,
          descriptionLocalizations: {
            "pt-BR": ptBr.chooseBotLanguageCommandOptionDescription,
          },
        },
      ],
    });
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = await UserService.getOrCreateUser(interaction.user.id);
    const translate = user.getTranslateFunction();

    const language = interaction.options.getString("language") as "en-US" | "pt-BR";
    if (!language) {
      await interaction.reply({
        ephemeral: true,
        content: translate("noLanguageSupplied"),
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const updatedUser = await UserService.updateUser(user.setPreferredLanguage(language));
    const updatedTranslate = updatedUser.getTranslateFunction();
    await interaction.editReply({
      content: updatedTranslate("languageUpdated", {
        language: updatedUser.preferredLanguage,
      }),
    });
  }
}
