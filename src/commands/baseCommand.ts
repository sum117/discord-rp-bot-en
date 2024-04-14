import type {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  AutocompleteInteraction,
  CommandInteraction,
  LocalizationMap,
} from "discord.js";

export type BaseCommandData = {
  name: string;
  nameLocalizations?: LocalizationMap;
  description: string;
  descriptionLocalizations?: LocalizationMap;
  options: ApplicationCommandOptionData[];
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
};

export abstract class BaseCommand {
  public data: ApplicationCommandData & {
    options: ApplicationCommandOptionData[];
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  };
  public constructor({
    name,
    description,
    options,
    autocomplete,
  }: BaseCommandData) {
    this.data = {
      name: name,
      description: description,
      options: options,
      autocomplete: autocomplete,
    };
  }

  abstract execute(interaction: CommandInteraction): Promise<void>;
}
