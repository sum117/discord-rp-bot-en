import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";

export interface BaseButonData {
  customId: string;
  style?: ButtonStyle;
  label: string;
  disabled?: boolean;
  emoji?: string;
}
export interface LinkButtonData extends BaseButonData {
  style: ButtonStyle.Link;
  url: string;
  onClick?: never;
}
export interface CommonButtonData extends BaseButonData {
  url?: never;
  style?: Exclude<ButtonStyle, ButtonStyle.Link>;
  onClick: (interaction: ButtonInteraction) => Promise<void>;
}

export type ButtonData = LinkButtonData | CommonButtonData;
export class Button {
  public customId: string;
  public style: ButtonStyle = ButtonStyle.Primary;
  public label: string;
  public disabled: boolean = false;
  public emoji?: string;
  public url?: string;
  public onClick?: (interaction: ButtonInteraction) => Promise<void>;

  public constructor(data: ButtonData) {
    this.customId = data.customId;
    this.label = data.label;
    if (data.style) {
      this.style = data.style;
    }
    if (data.disabled) {
      this.disabled = data.disabled;
    }
    if (data.emoji) {
      this.emoji = data.emoji;
    }

    if (this.style === ButtonStyle.Link) {
      this.url = data.url;
    } else {
      this.onClick = data.onClick;
    }
  }

  public getAPIComponent() {
    const builder = new ButtonBuilder()
      .setCustomId(this.customId)
      .setDisabled(this.disabled)
      .setLabel(this.label)
      .setStyle(this.style);

    if (this.emoji) {
      builder.setEmoji(this.emoji);
    }

    if (this.style === ButtonStyle.Link && this.url) {
      builder.setURL(this.url);
    }

    return builder;
  }
}
