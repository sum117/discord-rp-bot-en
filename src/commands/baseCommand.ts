import type {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  CommandInteraction,
  LocalizationMap,
} from "discord.js";

export type BaseCommandData = {
  name: string;
  nameLocalizations?: LocalizationMap;
  description: string;
  descriptionLocalizations?: LocalizationMap;
  options: ApplicationCommandOptionData[];
};

export abstract class BaseCommand {
  public data: ApplicationCommandData & {
    options: ApplicationCommandOptionData[];
  };
  public constructor({ name, description, options }: BaseCommandData) {
    this.data = {
      name: name,
      description: description,
      options: options,
    };
  }

  abstract execute(interaction: CommandInteraction): void;
}
