import Plugin from "@/models/Plugin";
import { ServerService } from "@/services/serverService";
import UserService from "@/services/userService";
import type { Message } from "discord.js";
import { DateTime, Duration } from "luxon";

type StreakCostEmoji = {
    emoji: string;
    cost: number;
};

const STREAK_COST_EMOJIS: StreakCostEmoji[] = [
    { emoji: "👻", cost: 0 },
    { emoji: "🥵", cost: 25 },
    { emoji: "🧨", cost: 50 },
    { emoji: "🔥", cost: 100 },
    { emoji: "☄️", cost: 500 },
    { emoji: "💫", cost: 1000 },
];

const STREAK_COST = 4;
const TIME_TO_EXPIRE_MS = Duration.fromObject({ days: 1 }).as("milliseconds");


export function determineUserCurrentStreakLevel(
    streak: number,
): StreakCostEmoji | undefined {
    const index = STREAK_COST_EMOJIS.findIndex(element => element.cost > streak);
    return STREAK_COST_EMOJIS[(index === -1 ? STREAK_COST_EMOJIS.length : index) - 1];
}

export async function tryChangeNickname(
    message: Message<true>,
    oldEmoji = STREAK_COST_EMOJIS[0]!.emoji,
    newEmoji = STREAK_COST_EMOJIS[0]!.emoji,
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


export const streakPlugin = new Plugin({
    name: "streak-plugin",
    nameLocalizations: {
        "pt-BR": "plugin-de-streak",
    },
    description: "A plugin to help you with player message streak.",
    descriptionLocalizations: {
        "pt-BR": "Um plugin para te ajudar com streaks de mensagens dos jogadores.",
    },
    author: "sum117",
    commands: [],
    exampleParagraphsLocalizations: {
        "pt-BR": [""],
    },
    exampleParagraphs: [""],
    async onUserMessage(message) {
        if (message.author.bot || !message.inGuild()) return;

        const user = await UserService.getOrCreateUser(message.author.id);
        const serverData = await ServerService.getOrCreateUserServerData(user.id, message.guildId);

        const oldStreakGroup = Math.floor(serverData.streak / STREAK_COST);
        const oldLevel = determineUserCurrentStreakLevel(oldStreakGroup);

        const lastStreakDate = DateTime.fromJSDate(serverData.lastStreakAt ?? new Date());
        const timeSinceLastStreak = DateTime.now().diff(lastStreakDate).as("milliseconds");

        if (timeSinceLastStreak >= TIME_TO_EXPIRE_MS) {
            serverData.streak = 0;
        }

        const updatedServerData = await ServerService.updateUserServerData(user.id, message.guildId, {
            streak: serverData.streak + 1,
        });

        const newStreakGroup = Math.floor(updatedServerData.streak / STREAK_COST);
        const newLevel = determineUserCurrentStreakLevel(newStreakGroup);

        if (newStreakGroup > oldStreakGroup && newStreakGroup > 0) {
            await tryChangeNickname(message, oldLevel?.emoji, newLevel?.emoji, newStreakGroup);
        }
    },
});
