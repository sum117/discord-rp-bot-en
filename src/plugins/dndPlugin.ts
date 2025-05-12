import { RollemParserV1 } from "@rollem/language";

import Plugin from "@/models/Plugin";
import UserService from "@/services/userService";

const DICE_EMOJI = "🎲";
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
  commands: [],
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
