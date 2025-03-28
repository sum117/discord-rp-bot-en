import {
  type ActionRowData,
  ComponentType,
  type ModalActionRowComponentData,
  type ModalSubmitInteraction,
  type TextInputStyle,
} from "discord.js";

export enum TextInputLength {
  Short = 128,
  Medium = 1024,
  Paragraph = 4000,
}

export interface TextInputData {
  customId: string;
  label: string;
  maxLength: TextInputLength;
  minLength?: number;
  placeholder: string;
  required?: boolean;
  style: TextInputStyle;
  type: ComponentType.TextInput;
  value?: string;
}

export const DISCORD_MODAL_MAX_TEXT_INPUTS = 5;

export default class Modal<T extends Record<string, string | number>> {
  public title = "";
  public customId = "";
  public components: ActionRowData<ModalActionRowComponentData>[] = [];
  private fields: Record<string, string> = {};

  public setTitle(title: string) {
    this.title = title;
    return this;
  }

  public setCustomId(customId: string) {
    this.customId = customId;
    return this;
  }

  public addTextInput(textInput: Omit<TextInputData, "type">) {
    if (this.components.length > DISCORD_MODAL_MAX_TEXT_INPUTS) {
      throw new Error("Maximum number of text inputs reached");
    }
    this.components.push({
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.TextInput,
          ...textInput,
        },
      ],
    });
    this.fields[textInput.customId] = textInput.value || "";
    return this;
  }

  public getUserResponse(interaction: ModalSubmitInteraction) {
    return Object.keys(this.fields).reduce((accumulator, key) => {
      return {
        ...accumulator,
        [key]: interaction.fields.getTextInputValue(key),
      };
    }, <T>{});
  }
}
