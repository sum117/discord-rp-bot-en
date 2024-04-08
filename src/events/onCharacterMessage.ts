import { Events, type Message } from "discord.js";
import { Duration } from "luxon";
import { MIN_MAX_EXP_PER_MESSAGE } from "../data/constants";
import CharacterService from "../services/characterService";
import CommonService from "../services/commonService";
import { BaseEvent } from "./baseEvent";

export default class onCharacterMessage extends BaseEvent {
  public constructor() {
    super({
      runsOn: Events.MessageCreate,
      name: "onCharacterMessage",
      description: "Event that listens for messages from characters.",
      descriptionLocalizations: {
        "pt-BR": "Evento que escuta mensagens de personagens.",
      },
    });
  }
  async execute(message: Message<boolean>) {
    const data = await CharacterService.getCurrentCharacterByUserId(
      message.author.id
    );
    if (!data) return;

    const messageOptions = data.character.getCharacterPostFromMessage(message);
    if (messageOptions) {
      await message.channel.send(messageOptions);

      const [minXp, maxXp] = MIN_MAX_EXP_PER_MESSAGE;
      const xpEarned = CommonService.randomIntFromInterval(minXp, maxXp);

      const { isLevelUp } = data.character.getLevelingDetails();
      if (isLevelUp(xpEarned)) {
        const updatedCharacter = await data.character.levelUp();
        const translate = data.author.getTranslateFunction();
        await message.channel.send(
          translate("characterLevelUp", {
            level: updatedCharacter.level,
            name: updatedCharacter.name,
          })
        );
      }

      void CommonService.tryDeleteMessage(
        message,
        Duration.fromObject({ minutes: 1 }).as("milliseconds")
      );
    }
  }
}
