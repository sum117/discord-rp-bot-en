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
    name: string;
    options: ApplicationCommandOptionData[];
    description: string;
    nameLocalizations?: LocalizationMap;
    descriptionLocalizations?: LocalizationMap;

    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  };
  public constructor({ name, description, options, autocomplete, ...rest }: BaseCommandData) {
    this.data = {
      name: name,
      nameLocalizations: rest.nameLocalizations,
      description: description,
      descriptionLocalizations: rest.descriptionLocalizations,
      options: options,
      autocomplete: autocomplete,
    };
  }

  abstract execute(interaction: CommandInteraction): Promise<void>;
}
