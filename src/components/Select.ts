import type { StringSelectMenuInteraction } from "discord.js";
import { StringSelectMenuBuilder } from "discord.js";

type SelectMenuOption = {
  default?: boolean;
  description?: string;
  emoji?: string;
  label: string;
  value: string;
};

type SelectMenuData = {
  customId: string;
  disabled?: boolean;
  onSelection: (interaction: StringSelectMenuInteraction) => Promise<void>;
  options: SelectMenuOption[];
  placeholder?: string;
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
