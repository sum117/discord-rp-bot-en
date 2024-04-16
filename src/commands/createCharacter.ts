import { type CommandInteraction } from "discord.js";
import { Duration } from "luxon";
import { RoleplayEvents, bot } from "..";
import enUS from "../locales/en-US.json";
import ptBr from "../locales/pt-BR.json";
import CharacterService from "../services/characterService";
import CommonService from "../services/commonService";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class CreateCharacterCommand extends BaseCommand {
  public constructor() {
    super({
      name: enUS.createCharacterCommandName,
      nameLocalizations: { "pt-BR": ptBr.createCharacterCommandName },
      description: enUS.createCharacterCommandDescription,
      descriptionLocalizations: {
        "pt-BR": ptBr.createCharacterCommandDescription,
      },
      options: [],
    });
  }

  async execute(interaction: CommandInteraction) {
    const user = await UserService.getOrCreateUser(interaction.user.id);
    const translate = user.getTranslateFunction();
    const modal = CharacterService.getCreateCharacterModal(user.preferredLanguage);
    await interaction.showModal(modal);

    const modalSubmit = await interaction
      .awaitModalSubmit({
        time: Duration.fromObject({ minutes: 120 }).as("milliseconds"),
        filter: (interaction) => interaction.user.id === user.id,
      })
      .catch((error) => console.log(`Didn't receive a response from the user ${user.id} in time.\n Error: ${error}`));

    if (modalSubmit) {
      await modalSubmit.deferReply({ ephemeral: true });
      const data = modal.getUserResponse(modalSubmit);

      if (!CommonService.isAbsoluteImageUrl(data?.imageUrl)) {
        await modalSubmit.editReply({
          content: translate("invalidImageUrl"),
        });
        return;
      }

      const createdCharacter = await CharacterService.createCharacter({
        ...data,
        authorId: user.id,
      });
      if (createdCharacter) {
        bot.emit(RoleplayEvents.CharacterCreate, createdCharacter);

        await modalSubmit.editReply({
          content: translate("createCharacterSuccess", {
            characterName: createdCharacter.name,
          }),
          files: [
            {
              attachment: createdCharacter.imageUrl,
              name: createdCharacter.imageUrl.split("/").pop()?.split("?").shift(),
            },
          ],
        });
      }
    }
  }
}
