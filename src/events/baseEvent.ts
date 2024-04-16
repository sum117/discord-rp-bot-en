import type { RoleplayBotEventPayloads } from "..";

export type BaseEventData = {
  // TODO: implement more later if needed
  runsOn: keyof RoleplayBotEventPayloads;
  name: string;
  nameLocalizations?: Record<string, string>;
  description: string;
  descriptionLocalizations?: Record<string, string>;
};
export abstract class BaseEvent {
  public runsOn: BaseEventData["runsOn"];
  public name: BaseEventData["name"];
  public description: BaseEventData["description"];
  public descriptionLocalizations: BaseEventData["descriptionLocalizations"];

  public constructor(data: BaseEventData) {
    this.runsOn = data.runsOn;
    this.name = data.name;
    this.description = data.description;
    this.descriptionLocalizations = data.descriptionLocalizations;
  }

  abstract execute(...args: RoleplayBotEventPayloads[BaseEventData["runsOn"]]): Promise<void>;
}
