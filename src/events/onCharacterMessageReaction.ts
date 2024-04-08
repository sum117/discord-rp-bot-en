import { Events, MessageReaction } from "discord.js";
import { BaseEvent } from "./baseEvent";

export default class onCharacterMessageReaction extends BaseEvent {
  public constructor() {
    super({
      runsOn: Events.MessageReactionAdd,
      name: "onCharacterMessageReaction",
      description:
        "Event that listens to reactions on messages and executes the corresponding action",
    });
  }

  async execute(messageReaction: MessageReaction) {}
}
