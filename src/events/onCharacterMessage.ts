import { Events, type Message } from "discord.js";
import { DateTime } from "luxon";

import { bot, EditingState, RoleplayEvents } from "..";
import { MIN_MAX_EXP_PER_MESSAGE, XP_COOLDOWN_MINUTES } from "../data/constants";
import enUS from "../locales/en-US.json";
import ptBr from "../locales/pt-BR.json";
import CharacterService from "../services/characterService";
import CommonService from "../services/commonService";
import { BaseEvent } from "./baseEvent";

export default class onCharacterMessage extends BaseEvent {
  public constructor() {
    super({
      runsOn: Events.MessageCreate,
      name: enUS.onCharacterMessageEventName,
      nameLocalizations: { "pt-BR": ptBr.onCharacterMessageEventName },
      description: enUS.onCharacterMessageDescription,
      descriptionLocalizations: {
        "pt-BR": ptBr.onCharacterMessageDescription,
      },
    });
  }
  async execute(message: Message<boolean>) {
    if (message.author.bot || bot.isEditing.get(message.author.id) === EditingState.Editing) {
      return;
    }

    const outOfTopicPrefixRegex = /^(\/|\\|\(|\))/m;
    if (message.content.match(outOfTopicPrefixRegex)) {
      return;
    }

    const data = await CharacterService.getCurrentCharacterByUserId(message.author.id);
    if (!data) {
      return;
    }

    const containsMentions = message.mentions.users.size > 0;
    let mentionsString: string | undefined;
    if (containsMentions) {
      mentionsString = message.mentions.users.map((user) => user.toString()).join("|");
      const mentionsRegex = new RegExp(`(${mentionsString})`, "g");
      message.content = message.content.replaceAll(mentionsRegex, "");
    }
    const messageOptions = await data.character.getCharacterPostFromMessage(message);
    if (messageOptions) {
      messageOptions.content = mentionsString;
      bot.emit(RoleplayEvents.CharacterPost, message, messageOptions, data.character);
      const [minXp, maxXp] = MIN_MAX_EXP_PER_MESSAGE;
      const xpEarned = CommonService.randomIntFromInterval(minXp, maxXp);

      const { isLevelUp } = data.character.getLevelingDetails();
      const hasPassedXpCooldown =
        DateTime.fromJSDate(data.character.lastExpGainAt ?? new Date()).diffNow("minutes").minutes >=
        XP_COOLDOWN_MINUTES;
      if (hasPassedXpCooldown) {
        if (isLevelUp(xpEarned + data.character.exp)) {
          const updatedCharacter = await data.character.levelUp();
          const translate = data.author.getTranslateFunction();
          await message.channel.send(
            translate("characterLevelUp", {
              level: updatedCharacter.level,
              characterName: updatedCharacter.name,
            }),
          );
        } else {
          data.character.exp += xpEarned;
          data.character.lastExpGainAt = DateTime.now().toJSDate();
          await CharacterService.updateCharacter(data.character);
        }
      }
      void CommonService.tryDeleteMessage(message);
    }
  }
}
