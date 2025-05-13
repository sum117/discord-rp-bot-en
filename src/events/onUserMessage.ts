import { Events, Message } from "discord.js";
import { BaseEvent } from "./baseEvent";
import UserService from "@/services/userService";
import { ServerService } from "@/services/serverService";
import { DateTime, Duration } from "luxon";

type StreakCostEmoji = {
  emoji: string;
  cost: number;
};

export default class OnUserMessage extends BaseEvent {
  private readonly STREAK_COST_EMOJIS: StreakCostEmoji[] = [
    { emoji: "👻", cost: 0 },
    { emoji: "🥵", cost: 25 },
    { emoji: "🧨", cost: 50 },
    { emoji: "🔥", cost: 100 },
    { emoji: "☄️", cost: 500 },
    { emoji: "💫", cost: 1000 },
  ];

  private static readonly STREAK_COST = 4;
  private static readonly TIME_TO_EXPIRE_MS = Duration.fromObject({ days: 1 }).as("milliseconds");

  public constructor() {
    super({
      runsOn: Events.MessageCreate,
      name: "onUserMessage",
      nameLocalizations: { "pt-BR": "EmMensagemDeUsuario" },
      description: "Triggered when a user sends a message.",
      descriptionLocalizations: {
        "pt-BR": "Disparado quando um usuário envia uma mensagem.",
      },
    });
  }

  public async execute(message: Message<true>) {
    if (message.author.bot || !message.inGuild()) return;

    const user = await UserService.getOrCreateUser(message.author.id);
    const serverData = await ServerService.getOrCreateUserServerData(user.id, message.guildId);

    const oldStreakGroup = Math.floor(serverData.streak / OnUserMessage.STREAK_COST);
    const oldLevel = this.determineUserCurrentStreakLevel(oldStreakGroup);

    const lastStreakDate = DateTime.fromJSDate(serverData.lastStreakAt ?? new Date());
    const timeSinceLastStreak = DateTime.now().diff(lastStreakDate).as("milliseconds");

    if (timeSinceLastStreak >= OnUserMessage.TIME_TO_EXPIRE_MS) {
      serverData.streak = 0;
    }

    const updatedServerData = await ServerService.updateUserServerData(user.id, message.guildId, {
      streak: serverData.streak + 1,
    });

    const newStreakGroup = Math.floor(updatedServerData.streak / OnUserMessage.STREAK_COST);
    const newLevel = this.determineUserCurrentStreakLevel(newStreakGroup);

    if (newStreakGroup > oldStreakGroup && newStreakGroup > 0) {
      await this.tryChangeNickname(message, oldLevel?.emoji, newLevel?.emoji, newStreakGroup);
    }
  }

  private determineUserCurrentStreakLevel(streak: number): StreakCostEmoji | undefined {
    const index = this.STREAK_COST_EMOJIS.findIndex(element => element.cost > streak);
    return this.STREAK_COST_EMOJIS[(index === -1 ? this.STREAK_COST_EMOJIS.length : index) - 1];
  }

  private async tryChangeNickname(
    message: Message<true>,
    oldEmoji = this.STREAK_COST_EMOJIS[0]!.emoji,
    newEmoji = this.STREAK_COST_EMOJIS[0]!.emoji,
    newCount: number
  ) {
    try {
      const member = message.member;
      if (!member || member.id === message.guild.members.me?.id || member.id === message.guild.ownerId) {
        return;
      }

      const currentNickname = member.nickname ?? message.author.username;

      const regex = new RegExp(`\\| .* \\d+`, "g");
      const updatedNickname = currentNickname
        .replace(regex, "")
        .trim()
        .concat(` | ${newEmoji} ${newCount}`);

      if (updatedNickname.length <= 32) {
        await member.setNickname(updatedNickname, "Streak level up");
      }

    } catch (err) {
      console.error("Failed to change nickname", err);
    }
  }
}
