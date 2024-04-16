import { Events, type Message } from "discord.js";
import { DateTime } from "luxon";
import { EditingState, RoleplayEvents, bot } from "..";
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
    if (message.author.bot || bot.isEditing.get(message.author.id) === EditingState.Editing) return;

    const data = await CharacterService.getCurrentCharacterByUserId(message.author.id);
    if (!data) return;

    const messageOptions = await data.character.getCharacterPostFromMessage(message);
    if (messageOptions) {
      bot.emit(RoleplayEvents.CharacterPost, message, messageOptions, data.character);
      const [minXp, maxXp] = MIN_MAX_EXP_PER_MESSAGE;
      const xpEarned = CommonService.randomIntFromInterval(minXp, maxXp);

      const { isLevelUp } = data.character.getLevelingDetails();
      const hasPassedXpCooldown =
        DateTime.now().diff(DateTime.fromJSDate(data.character.lastExpGainAt ?? new Date()), "minutes").minutes >=
        XP_COOLDOWN_MINUTES;
      if (isLevelUp(xpEarned) && hasPassedXpCooldown) {
        const updatedCharacter = await data.character.levelUp();
        const translate = data.author.getTranslateFunction();
        await message.channel.send(
          translate("characterLevelUp", {
            level: updatedCharacter.level,
            characterName: updatedCharacter.name,
          })
        );
      }
      void CommonService.tryDeleteMessage(message);
    }
  }
}
