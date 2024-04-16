import { StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";

type SelectMenuOption = {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
};

type SelectMenuData = {
  customId: string;
  placeholder?: string;
  disabled?: boolean;
  options: SelectMenuOption[];
  onSelection: (interaction: StringSelectMenuInteraction) => Promise<void>;
};
export class Select {
  public options: SelectMenuOption[];
  public customId: string;
  public placeholder?: string;
  public disabled?: boolean;
  public onSelection: (interaction: StringSelectMenuInteraction) => Promise<void>;

  public constructor(data: SelectMenuData) {
    this.options = data.options;
    this.customId = data.customId;
    this.placeholder = data.placeholder;
    this.disabled = data.disabled;
    this.onSelection = data.onSelection;
  }

  public getAPIComponent() {
    const builder = new StringSelectMenuBuilder().setCustomId(this.customId).addOptions(...this.options);
    if (this.disabled) {
      builder.setDisabled(this.disabled);
    }
    if (this.placeholder) {
      builder.setPlaceholder(this.placeholder);
    }

    return builder;
  }
}
