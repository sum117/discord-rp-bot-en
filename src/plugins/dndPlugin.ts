import { RollemParserV1 } from "@rollem/language";
import { TextInputStyle } from "discord.js";
import { Duration } from "luxon";

import Modal, { TextInputLength } from "@/components/Modal";
import Plugin, { type PluginCommand } from "@/models/Plugin";
import CharacterService from "@/services/characterService";
import UserService from "@/services/userService";

const DICE_EMOJI = "<:1d20:1232390287926497280>";

export type CreateEditDiceModalData = {
  name: string;
  dice: string;
  description: string;
};

const createDiceCommand: PluginCommand = {
  name: "create-dice",
  nameLocalizations: {
    "pt-BR": "criar-dado",
  },
  description: "Create a dice.",
  descriptionLocalizations: {
    "pt-BR": "Cria um dado.",
  },
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }
    const user = await UserService.getOrCreateUser(interaction.user.id);
    const translate = user.getTranslateFunction();
    const modal = new Modal<CreateEditDiceModalData>()
      .setTitle(translate("createDice"))
      .setCustomId("create-edit-dice-modal")
      .addTextInput({
        customId: "create-edit-dice-name",
        label: translate("name"),
        placeholder: translate("enterDiceNamePlaceholder"),
        required: true,
        maxLength: TextInputLength.Short,
        style: TextInputStyle.Short,
        minLength: 1,
      })
      .addTextInput({
        customId: "create-edit-dice-dice",
        label: translate("dice"),
        placeholder: translate("enterDicePlaceholder"),
        required: true,
        maxLength: TextInputLength.Short,
        style: TextInputStyle.Short,
        minLength: 1,
      })
      .addTextInput({
        customId: "create-edit-dice-description",
        label: translate("description"),
        placeholder: translate("enterDiceDescriptionPlaceholder"),
        required: false,
        maxLength: TextInputLength.Paragraph,
        style: TextInputStyle.Paragraph,
      });

    await interaction.showModal(modal);

    const modalSubmit = await interaction
      .awaitModalSubmit({
        time: Duration.fromObject({ minutes: 120 }).as("milliseconds"),
        filter: (interaction) => interaction.user.id === user.id && interaction.customId === "create-edit-dice-modal",
      })
      .catch((error) => console.log(`Didn't receive a response from the user ${user.id} in time.\n Error: ${error}`));

    if (modalSubmit) {
      await modalSubmit.deferReply({ ephemeral: true });
      const data = modal.getUserResponse(modalSubmit);
      const currentCharacter = await CharacterService.getCurrentCharacterByUserId(user.id);
      if (currentCharacter) {
        const characterCreatedDice = await CharacterService.createCharacterDice({
          characterId: currentCharacter.character.id,
          ...data,
        });
        if (characterCreatedDice) {
          await modalSubmit.editReply(
            translate("diceCreated", {
              diceName: characterCreatedDice.name,
              diceDescription: characterCreatedDice.description,
              characterName: currentCharacter.character.name,
            }),
          );
        }
      } else {
        await modalSubmit.editReply(translate("noCurrentCharacter"));
      }
    }
  },
  options: [],
};

// const editDiceCommand: PluginCommand = {
//   name: "edit-dice",
//   nameLocalizations: {
//     "pt-BR": "editar-dado",
//   },
//   description: "Edit a dice.",
//   descriptionLocalizations: {
//     "pt-BR": "Edita um dado.",
//   },
// };

export const dndPlugin = new Plugin({
  name: "dnd-plugin",
  nameLocalizations: {
    "pt-BR": "plugin-de-dnd",
  },
  description: "A plugin to help you with D&D.",
  descriptionLocalizations: {
    "pt-BR": "Um plugin para te ajudar com D&D.",
  },
  author: "sum117",
  commands: [createDiceCommand],
  exampleParagraphsLocalizations: {
    "pt-BR": [""],
  },
  exampleParagraphs: [""],
  async onBeforeCharacterPost(message, messageOptions, character) {
    const parser = new RollemParserV1();
    // TODO: refactor this to include user gathering directly inside onCharacterMessage when needed.
    const user = await UserService.getOrCreateUser(message.author.id);
    const translate = user.getTranslateFunction();

    const result = parser.tryParse(message.content);
    if (result) {
      const newContent = translate("roll", {
        characterName: character.name,
        roll: `**${result.value}** ${result.pretties}`,
        emoji: DICE_EMOJI,
      });
      messageOptions.embeds = [];
      messageOptions.files = [];
      messageOptions.content = newContent;
    }
  },
});
