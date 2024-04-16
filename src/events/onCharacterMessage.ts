import { Events, type Message } from "discord.js";
import { DateTime } from "luxon";
import { MIN_MAX_EXP_PER_MESSAGE, XP_COOLDOWN_MINUTES } from "../data/constants";
import enUS from "../locales/en-US.json";
import ptBr from "../locales/pt-BR.json";
import CharacterService from "../services/characterService";
import CommonService from "../services/commonService";
import PostService from "../services/postService";
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
    if (message.author.bot) return;

    const data = await CharacterService.getCurrentCharacterByUserId(message.author.id);
    if (!data) return;

    const messageOptions = data.character.getCharacterPostFromMessage(message);
    if (messageOptions) {
      const sentPost = await message.channel.send(messageOptions);
      const [minXp, maxXp] = MIN_MAX_EXP_PER_MESSAGE;
      const xpEarned = CommonService.randomIntFromInterval(minXp, maxXp);

      const { isLevelUp } = data.character.getLevelingDetails();
      const hasPassedXpCooldown =
        DateTime.now().diff(DateTime.fromJSDate(data.character.lastPostAt ?? new Date()), "minutes").minutes >=
        XP_COOLDOWN_MINUTES;
      if (isLevelUp(xpEarned) && hasPassedXpCooldown) {
        const updatedCharacter = await data.character.levelUp();
        const translate = data.author.getTranslateFunction();
        await message.channel.send(
          translate("characterLevelUp", {
            level: updatedCharacter.level,
            characterName: updatedCharacter.name,
          }),
        );
      }

      await PostService.createPost({
        authorId: message.author.id,
        content: message.content,
        messageId: sentPost.id,
        channelId: sentPost.channel.id,
        guildId: sentPost.guild?.id ?? "",
        characters: [data.character],
      });

      void CommonService.tryDeleteMessage(message);
    }
  }
}
