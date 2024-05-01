import type {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  AutocompleteInteraction,
  CommandInteraction,
  LocalizationMap,
} from "discord.js";

export type BaseCommandData = {
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void;
  description: string;
  descriptionLocalizations?: LocalizationMap;
  name: string;
  nameLocalizations?: LocalizationMap;
  options: ApplicationCommandOptionData[];
};

export abstract class BaseCommand {
  public data: ApplicationCommandData & {
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void;
    description: string;
    descriptionLocalizations?: LocalizationMap;
    name: string;
    nameLocalizations?: LocalizationMap;

    options: ApplicationCommandOptionData[];
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
