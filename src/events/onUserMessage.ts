import { Events, Message } from "discord.js";
import { BaseEvent } from "./baseEvent";
import { ServerService } from "@/services/serverService";


export default class OnUserMessage extends BaseEvent {

  public constructor() {
    super({
      runsOn: Events.MessageCreate,
      name: "onUserMessage",
      nameLocalizations: { "pt-BR": "EmMensagemDeUsuario" },
      description: "Triggered when a user sends a message.",
      descriptionLocalizations: {
        "pt-BR": "Disparado quando um usuário envia uma mensagem.",
      },
    });
  }

  public async execute(message: Message<true>) {
    const server = await ServerService.getOrCreateServer(message.guild.id);
    const serverPlugins = server.getPlugins();

    await Promise.all(
      serverPlugins.map((plugin) => plugin.onUserMessage?.(message)),
    ).catch((error) => {
      console.error(error);
    });

  }

}
