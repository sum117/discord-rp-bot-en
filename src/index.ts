import {
  ActivityType,
  type BaseMessageOptions,
  type ChatInputCommandInteraction,
  Client,
  type ClientEvents,
  DiscordAPIError,
  Events,
  GatewayIntentBits,
  InteractionType,
  type Message,
  Partials,
} from "discord.js";
import { Hono } from "hono";
import { cors } from "hono/cors";

import api from "./api";
import authApi from "./api/auth";
/**
 * Currently, bun build doesn't support import * from index files, so I have to import the commands one by one to make sure they are included in the build.
 * This is a workaround until this issue is fixed:
 */
import { BaseCommand } from "./commands/baseCommand";
import ChooseBotLanguageComand from "./commands/chooseBotLanguage";
import ChooseCurrentCharacterCommand from "./commands/chooseCurrentCharacter";
import CreateCharacterCommand from "./commands/createCharacter";
import DeleteCharacterCommand from "./commands/deleteCharacter";
import ManagePluginsCommand from "./commands/managePlugins";
import RemoveCurrentCharacterCommand from "./commands/removeCurrentCharacter";
import ShowCharacterProfileCommand from "./commands/showCharacterProfile";
import TopCommand from "./commands/top";
import { BaseEvent } from "./events/baseEvent";
import onCharacterMessageEvent from "./events/onCharacterMessage";
import onCharacterMessageReactioEvent from "./events/onCharacterMessageReaction";
/**
 *  ------------------------------------------------------------------------------
 */
import type { Character } from "./models/Character";
import type { User } from "./models/User";
import { dndPlugin } from "./plugins/dndPlugin";
import { moneyPlugin } from "./plugins/moneyPlugin";
import type { characters, items } from "./schema";
import PostService from "./services/postService";
import { ServerService } from "./services/serverService";
import web from "./web";

export interface RoleplayEventPayloads {
  characterCreate: [character: typeof characters.$inferSelect];
  characterDelete: [character: typeof characters.$inferSelect];
  characterPost: [userMessage: Message, messageOptions: BaseMessageOptions, character: Character];
  showCharacterProfile: [
    messageOptions: BaseMessageOptions,
    character: Character,
    user: User,
    whenProfileSent: (profilePanel: Message) => Promise<void> | void,
    sendFn: (messageOptions: BaseMessageOptions) => Promise<Message>,
    serverId: string,
  ];
  characterUpdate: [character: typeof characters.$inferSelect];
  itemCreate: [item: typeof items.$inferSelect];
  itemDelete: [item: typeof items.$inferSelect];
  itemUpdate: [item: typeof items.$inferSelect];
}
export enum RoleplayEvents {
  CharacterCreate = "characterCreate",
  CharacterDelete = "characterDelete",
  CharacterUpdate = "characterUpdate",
  CharacterPost = "characterPost",
  ShowCharacterProfile = "showCharacterProfile",
  ItemCreate = "itemCreate",
  ItemDelete = "itemDelete",
  ItemUpdate = "itemUpdate",
}
export type RoleplayBotEvents = Events | RoleplayEvents;
export type RoleplayBotEventPayloads = RoleplayEventPayloads & ClientEvents;

export enum EditingState {
  NotEditing = "notEditing",
  Editing = "editing",
}
export class RoleplayBot extends Client {
  public isEditing = new Map<string, EditingState>();
  public commands = new Map<string, BaseCommand>();
  public availablePlugins = [moneyPlugin, dndPlugin];
  public on<Event extends keyof RoleplayBotEventPayloads>(
    event: Event,
    listener: (...args: RoleplayBotEventPayloads[Event]) => void,
  ): this;
  on(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }
  public emit<Event extends keyof RoleplayEventPayloads>(event: Event, ...args: RoleplayEventPayloads[Event]): boolean;
  emit(event: string | symbol, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }
  public setUpApplicationCommands() {
    for (const Command of [
      ChooseBotLanguageComand,
      ChooseCurrentCharacterCommand,
      CreateCharacterCommand,
      ManagePluginsCommand,
      RemoveCurrentCharacterCommand,
      ShowCharacterProfileCommand,
      DeleteCharacterCommand,
      TopCommand,
    ]) {
      if (Command.prototype instanceof BaseCommand) {
        const command = new Command();
        this.commands.set(command.data.name, command);
        void this.application?.commands.create(command.data);
        console.log(`✅ Registered command: ${command.data.name}`);
      }
    }
  }

  public setUpEvents() {
    const eventSet = new Set<keyof RoleplayBotEventPayloads>();
    const eventClasses: Record<string, BaseEvent[]> = {};
    for (const Event of [onCharacterMessageEvent, onCharacterMessageReactioEvent]) {
      if (Event.prototype instanceof BaseEvent) {
        const event: BaseEvent = new Event();
        eventSet.add(event.runsOn);
        if (!eventClasses[event.runsOn]) {
          eventClasses[event.runsOn] = [event];
        } else {
          eventClasses[event.runsOn]!.push(event);
        }
        console.log(`✅ Registered event: ${event.name} (${event.runsOn})`);
      }
    }
    for (const event of eventSet) {
      this.on(event, (...args) => {
        eventClasses[event]?.forEach(async (eventClass) => {
          try {
            await eventClass.execute(...args);
          } catch (error) {
            console.error(error);
          }
        });
      });
    }
  }
}

export const bot = new RoleplayBot({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Reaction],
});
bot.setUpEvents();

bot.on(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
  readyClient.user.setPresence({
    activities: [
      {
        name: "Mango White Enclavera?",
        type: ActivityType.Listening,
        url: "https://youtu.be/p2n_E7wX5iU?si=Vl_GQMoDftr9NSdD",
      },
    ],
  });
  bot.setUpApplicationCommands();
  const servers = await Promise.all(readyClient.guilds.cache.map((guild) => ServerService.getOrCreateServer(guild.id)));
  for await (const server of servers) {
    const guild = readyClient.guilds.cache.get(server.id);
    if (guild) {
      for await (const plugin of server.getPlugins()) {
        for await (const commands of plugin.getCommands()) {
          await guild.commands.create(commands);
        }
      }
    }
  }
});

bot.on(Events.InteractionCreate, async (interaction) => {
  try {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand: {
        const command = bot.commands.get(interaction.commandName);
        if (command) {
          await command.execute(interaction);
        } else {
          const plugin = bot.availablePlugins.find((plugin) =>
            plugin.commandsData.some((command) => command.name === interaction.commandName),
          );
          if (plugin) {
            const pluginCommandData = plugin.commandsData.find((command) => command.name === interaction.commandName);
            if (pluginCommandData) {
              await pluginCommandData.execute(interaction as ChatInputCommandInteraction);
            }
          }
        }
        break;
      }
      case InteractionType.ApplicationCommandAutocomplete: {
        const command = bot.commands.get(interaction.commandName);
        if (command) {
          await command.data.autocomplete?.(interaction);
        }
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// bot.on(RoleplayEvents.CharacterCreate, (character) => {});
// bot.on(RoleplayEvents.CharacterDelete, (character) => {});
// bot.on(RoleplayEvents.CharacterUpdate, (character) => {});
// bot.on(RoleplayEvents.ItemCreate, (item) => {});
// bot.on(RoleplayEvents.ItemDelete, (item) => {});
// bot.on(RoleplayEvents.ItemUpdate, (item) => {});

bot.on(RoleplayEvents.CharacterPost, async (userMessage, messageOptions, character) => {
  if (!userMessage.inGuild()) {
    return;
  }

  const server = await ServerService.getOrCreateServer(userMessage.guild.id);
  const serverPlugins = server.getPlugins();

  await Promise.all(
    serverPlugins.map((plugin) => plugin.onBeforeCharacterPost?.(userMessage, messageOptions, character)),
  ).catch((error) => {
    console.error(error);
  });
  const sentPost = await userMessage.channel.send(messageOptions);
  await PostService.createPost({
    authorId: userMessage.author.id,
    content: userMessage.content,
    messageId: sentPost.id,
    channelId: sentPost.channel.id,
    guildId: sentPost.guild?.id ?? "",
    characters: [character],
  });
  await Promise.all(serverPlugins.map((plugin) => plugin.onAfterCharacterPost?.(userMessage, character))).catch(
    (error) => {
      console.error(error);
    },
  );
});

bot.on(
  RoleplayEvents.ShowCharacterProfile,
  async (messageOptions, character, user, whenProfileSent, sendFn, serverId) => {
    const server = await ServerService.getOrCreateServer(serverId);
    const serverPlugins = server?.getPlugins() ?? [];
    await Promise.all(
      serverPlugins.map((plugin) => plugin.onBeforeShowCharacterProfile?.(messageOptions, character, user, server)),
    ).catch((error) => {
      console.error(error);
    });
    const profilePanel = await sendFn(messageOptions);
    await whenProfileSent(profilePanel);
    await Promise.all(
      serverPlugins.map((plugin) => plugin.onAfterShowCharacterProfile?.(profilePanel, character, user)),
    ).catch((error) => {
      console.error(error);
    });
  },
);

bot.on(Events.Error, (error) => {
  if (error instanceof DiscordAPIError) {
    console.error(
      `Discord API Error (${error.code}): ${error.cause}\nMessage: ${error.message}\nMethod: ${error.method}\n$Body: ${error.requestBody}\nStack:${error.stack}`,
    );
  }
});

const server = new Hono();
server.use(cors({ origin: "*", allowMethods: ["GET", "POST", "REPLACE", "DELETE"] }));
server.use("/api/*");
server.route("/api", api);
server.route("/auth", authApi);
server.route("/", web);
bot.login(Bun.env.BOT_TOKEN);
export default {
  port: 3000,
  hostname: "localhost",
  fetch: server.fetch,
};
