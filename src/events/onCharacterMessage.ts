import { Events, type Message } from "discord.js";
import { Duration } from "luxon";
import CharacterService from "../services/characterService";
import CommonService from "../services/commonService";
import { BaseEvent } from "./baseEvent";

export default class onCharacterMessage extends BaseEvent {
  public constructor() {
    super({
      runsOn: Events.MessageCreate,
      name: "onCharacterMessage",
      description: "Event that listens for messages from characters.",
      descriptionLocalizations: {
        "pt-BR": "Evento que escuta mensagens de personagens.",
      },
    });
  }
  async execute(message: Message<boolean>) {
    const messageOptions = await CharacterService.buildCharacterPostFromMessage(
      message
    );
    if (messageOptions) {
      await message.channel.send(messageOptions);
      void CommonService.tryDeleteMessage(
        message,
        Duration.fromObject({ minutes: 1 }).as("milliseconds")
      );
    }
  }

  private handleXpGains() {}
}
