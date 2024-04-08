import { Events, type Message } from "discord.js";
import { Duration } from "luxon";
import { MIN_MAX_EXP_PER_MESSAGE } from "../data/constants";
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
    const data = await CharacterService.getCurrentCharacterByUserId(
      message.author.id
    );
    if (!data) return;

    const messageOptions = data.character.getCharacterPostFromMessage(message);
    if (messageOptions) {
      const sentPost = await message.channel.send(messageOptions);
      await PostService.createPost({
        authorId: message.author.id,
        content: sentPost.content,
        messageId: sentPost.id,
        channelId: sentPost.channel.id,
        guildId: sentPost.guild?.id ?? "",
        characters: [data.character],
      });

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
