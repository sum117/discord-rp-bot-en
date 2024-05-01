import type { BaseMessageOptions, ChatInputCommandInteraction, Message } from "discord.js";

import type { BaseCommandData } from "../commands/baseCommand";
import type { Character } from "./Character";
import type Server from "./Server";
import type { User } from "./User";

export type PluginCommand = BaseCommandData & {
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

type PluginData = {
  author: string;
  commands: Array<PluginCommand>;
  description: string;
  descriptionLocalizations: Record<string, string>;
  exampleParagraphs: Array<string>;
  exampleParagraphsLocalizations: Record<string, Array<string>>;
  name: string;
  nameLocalizations: Record<"pt-BR", string>;
  onAfterCharacterPost?: (message: Message, character: Character) => Promise<void>;
  onAfterShowCharacterProfile?: (message: Message, character: Character, user: User) => Promise<void>;
  onBeforeCharacterPost?: (message: Message, messageOptions: BaseMessageOptions, character: Character) => Promise<void>;
  onBeforeShowCharacterProfile?: (
    messageOptions: BaseMessageOptions,
    character: Character,
    user: User,
    server: Server,
  ) => Promise<void>;
};

export default class Plugin {
  public name: string;
  public nameLocalizations: Record<string, string>;
  public description: string;
  public descriptionLocalizations: Record<string, string>;
  public exampleParagraphs: Array<string>;
  public exampleParagraphsLocalizations: Record<string, Array<string>>;
  public author: string;
  public commandsData: Array<PluginCommand>;
  public onBeforeCharacterPost?: (
    message: Message,
    messageOptions: BaseMessageOptions,
    character: Character,
  ) => Promise<void>;
  public onAfterCharacterPost?: (message: Message, character: Character) => Promise<void>;
  public onBeforeShowCharacterProfile?: (
    messageOptions: BaseMessageOptions,
    character: Character,
    user: User,
    server: Server,
  ) => Promise<void>;
  public onAfterShowCharacterProfile?: (message: Message, character: Character, user: User) => Promise<void>;
  public constructor({
    name,
    description,
    exampleParagraphs,
    author,
    commands,
    onAfterCharacterPost,
    onBeforeCharacterPost,
    onAfterShowCharacterProfile,
    onBeforeShowCharacterProfile,
    descriptionLocalizations,
    exampleParagraphsLocalizations,
    nameLocalizations,
  }: PluginData) {
    this.nameLocalizations = nameLocalizations;
    this.descriptionLocalizations = descriptionLocalizations;
    this.exampleParagraphsLocalizations = exampleParagraphsLocalizations;
    this.name = name;
    this.description = description;
    this.exampleParagraphs = exampleParagraphs ?? [];
    this.author = author;
    this.commandsData = commands;
    this.onBeforeCharacterPost = onBeforeCharacterPost;
    this.onAfterCharacterPost = onAfterCharacterPost;
    this.onBeforeShowCharacterProfile = onBeforeShowCharacterProfile;
    this.onAfterShowCharacterProfile = onAfterShowCharacterProfile;
  }

  public getCommands() {
    return this.commandsData;
  }

  public getExampleParagraphs() {
    return this.exampleParagraphs;
  }

  public getName() {
    return this.name;
  }

  public getDescription() {
    return this.description;
  }

  public getAuthor() {
    return this.author;
  }
}
