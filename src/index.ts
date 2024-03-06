import {
  Client,
  Events,
  GatewayIntentBits,
  type ClientEvents,
} from "discord.js";
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
}

export const bot = new RoleplayBot({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

bot.on(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
});

bot.on(Events.MessageCreate, (message) => {});
bot.on(Events.InteractionCreate, (interaction) => {});

bot.on(RoleplayEvents.CharacterCreate, (character) => {});
bot.on(RoleplayEvents.CharacterDelete, (character) => {});
bot.on(RoleplayEvents.CharacterUpdate, (character) => {});
bot.on(RoleplayEvents.ItemCreate, (item) => {});
bot.on(RoleplayEvents.ItemDelete, (item) => {});
bot.on(RoleplayEvents.ItemUpdate, (item) => {});

bot.login(Bun.env.BOT_TOKEN);
