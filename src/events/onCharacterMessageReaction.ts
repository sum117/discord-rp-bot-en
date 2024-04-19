import { Events, MessageReaction } from "discord.js";
import { Duration } from "luxon";
import { EditingState, bot } from "..";
import CommonService from "../services/commonService";
import PostService from "../services/postService";
import UserService from "../services/userService";
import { BaseEvent } from "./baseEvent";

export default class onCharacterMessageReaction extends BaseEvent {
  public POSSIBLE_REACTIONS = ["✏️", "❌"];
  public constructor() {
    super({
      runsOn: Events.MessageReactionAdd,
      name: "on-character-message-reaction",
      nameLocalizations: {
        "pt-BR": "na-reacao-de-mensagem-de-personagem",
      },
      description: "Event that listens to reactions on messages and executes the corresponding action",
      descriptionLocalizations: {
        "pt-BR": "Evento que escuta reações em mensagens e executa a ação correspondente",
      },
    });
  }

  async execute(messageReaction: MessageReaction) {
    if (!this.POSSIBLE_REACTIONS.includes(messageReaction.emoji.name ?? "")) return;

    const post = await PostService.getPostByMessageId(messageReaction.message.id);
    if (!post) return;

    const userWhoReacted = messageReaction.users.cache.last();
    if (post.authorId !== userWhoReacted?.id) return;

    if (messageReaction.emoji.name === "✏️") {
      const messageToEdit = await messageReaction.message.channel.messages.fetch(post.messageId).catch(() => {
        console.error("Message with ID ", post.messageId, " not found");
        return null;
      });
      if (!messageToEdit) return;

      const apiEmbed = messageToEdit.embeds.at(0);
      if (apiEmbed) {
        const messageCollector = messageToEdit.channel.createMessageCollector({
          filter: (collectedMessage) => collectedMessage.author.id === post.authorId,
          max: 1,
        });
        const user = await UserService.getOrCreateUser(userWhoReacted.id);
        const translate = user.getTranslateFunction();
        const feedback = await messageToEdit.channel.send(
          translate("editPostFeedback", {
            user: userWhoReacted.displayName,
            time: 15,
          }),
        );
        bot.isEditing.set(post.authorId, EditingState.Editing);
        void CommonService.tryDeleteMessage(feedback, Duration.fromObject({ seconds: 10 }).as("milliseconds"));
        messageCollector.on("collect", async (collectedMessage) => {
          try {
            const character = post.characters.at(0);
            if (!character) return;
            await messageToEdit.edit(await character.getCharacterPostFromMessage(collectedMessage));
            await PostService.updatePostContentByMessageId(post.messageId, collectedMessage.content);
            void CommonService.tryDeleteMessage(collectedMessage);
            const successFeedback = await collectedMessage.channel.send(
              translate("editPostSuccess", { user: userWhoReacted.toString() }),
            );
            void CommonService.tryDeleteMessage(
              successFeedback,
              Duration.fromObject({ seconds: 5 }).as("milliseconds"),
            );
          } catch (error) {
            console.error(`Failed to edit message with ID ${post.messageId} for user ${userWhoReacted.id}`);
          } finally {
            bot.isEditing.set(post.authorId, EditingState.NotEditing);
          }
        });
      }
    } else if (messageReaction.emoji.name === "❌") {
      await PostService.deletePostByMessageId(messageReaction.message.id);
      await messageReaction.message.delete().catch(() => {
        console.error("Failed to delete message with ID ", messageReaction.message.id);
      });
    }
  }
}
