import { TextInputStyle } from "discord.js";
import Modal, { TextInputLength } from "../components/Modal";
import { TEXT_INPUT_CUSTOM_IDS } from "../data/constants";
import { translateFactory } from "../i18n";

export default class CharacterService {
  public static getCreateCharacterModal(
    userOrServerLanguage: "pt-BR" | "en-US" = "pt-BR"
  ) {
    const translate = translateFactory(userOrServerLanguage);
    return new Modal<Record<keyof typeof TEXT_INPUT_CUSTOM_IDS, string>>()
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.name,
        label: translate("modalCharacterNameLabel"),
        placeholder: translate("modalCharacterNamePlaceholder"),
        maxLength: TextInputLength.Short,
        style: TextInputStyle.Short,
        required: true,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.imageUrl,
        label: translate("modalCharacterImageUrlLabel"),
        placeholder: translate("modalCharacterImageUrlPlaceholder"),
        maxLength: TextInputLength.Short,
        style: TextInputStyle.Short,
        required: true,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.appearance,
        label: translate("modalCharacterAppearanceLabel"),
        placeholder: translate("modalCharacterAppearancePlaceholder"),
        maxLength: TextInputLength.Medium,
        style: TextInputStyle.Paragraph,
        required: true,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.backstory,
        label: translate("modalCharacterBackstoryLabel"),
        placeholder: translate("modalCharacterBackstoryPlaceholder"),
        maxLength: TextInputLength.Paragraph,
        style: TextInputStyle.Paragraph,
        required: false,
      })
      .addTextInput({
        customId: TEXT_INPUT_CUSTOM_IDS.personality,
        label: translate("modalCharacterPersonalityLabel"),
        placeholder: translate("modalCharacterPersonalityPlaceholder"),
        maxLength: TextInputLength.Paragraph,
        style: TextInputStyle.Paragraph,
        required: false,
      });
  }
}
