import {
  Client,
  Events,
  GatewayIntentBits,
  InteractionType,
  type ClientEvents,
} from "discord.js";
import { readdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { BaseCommand } from "./commands/baseCommand";
import type { characters, items } from "./schema";
export interface RoleplayEventPayloads {
  characterCreate: [character: typeof characters.$inferSelect];
  characterDelete: [character: typeof characters.$inferSelect];
  characterUpdate: [character: typeof characters.$inferSelect];
  itemCreate: [item: typeof items.$inferSelect];
  itemDelete: [item: typeof items.$inferSelect];
  itemUpdate: [item: typeof items.$inferSelect];
}
export enum RoleplayEvents {
  CharacterCreate = "characterCreate",
  CharacterDelete = "characterDelete",
  CharacterUpdate = "characterUpdate",
  ItemCreate = "itemCreate",
  ItemDelete = "itemDelete",
  ItemUpdate = "itemUpdate",
}
export type RoleplayBotEvents = Events | RoleplayEvents;
export type RoleplayBotEventPayloads = RoleplayEventPayloads & ClientEvents;

export class RoleplayBot extends Client {
  public commands = new Map<string, BaseCommand>();
  public on<Event extends keyof RoleplayBotEventPayloads>(
    event: Event,
    listener: (...args: RoleplayBotEventPayloads[Event]) => void
  ): this;
  on(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }
  public emit<Event extends keyof RoleplayEventPayloads>(
    event: Event,
    ...args: RoleplayEventPayloads[Event]
  ): boolean;
  emit(event: string | symbol, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }
  public async setUpApplicationCommands() {
    const commands = await readdir(
      fileURLToPath(join(dirname(import.meta.url), "commands"))
    );
    for (const command of commands) {
      const { default: Command } = await import(`./commands/${command}`);
      if (Command && Command.prototype instanceof BaseCommand) {
        const command = new Command();
        this.commands.set(command.data.name, command);
        await this.application?.commands.create(command.data);
        console.log(`✅ Registered command: ${command.data.name}`);
      }
    }
  }
}

export const bot = new RoleplayBot({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

bot.on(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
  await bot.setUpApplicationCommands();
});

bot.on(Events.MessageCreate, (message) => {});
bot.on(Events.InteractionCreate, (interaction) => {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      const command = bot.commands.get(interaction.commandName);
      if (command) {
        command.execute(interaction);
      }
      break;
  }
});

bot.on(RoleplayEvents.CharacterCreate, (character) => {});
bot.on(RoleplayEvents.CharacterDelete, (character) => {});
bot.on(RoleplayEvents.CharacterUpdate, (character) => {});
bot.on(RoleplayEvents.ItemCreate, (item) => {});
bot.on(RoleplayEvents.ItemDelete, (item) => {});
bot.on(RoleplayEvents.ItemUpdate, (item) => {});

bot.login(Bun.env.BOT_TOKEN);
