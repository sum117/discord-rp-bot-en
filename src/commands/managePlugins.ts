import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  resolveColor,
  type APIEmbed,
  type CommandInteraction,
  type HexColorString,
} from "discord.js";
import { Duration } from "luxon";
import { bot } from "..";
import { Button } from "../components/Button";
import type Plugin from "../models/Plugin";
import CommonService from "../services/commonService";
import { ServerService } from "../services/serverService";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";

export default class ManagePlugin extends BaseCommand {
  public constructor() {
    super({
      name: "manage-plugins",
      description: "Add a plugin to the server.",
      nameLocalizations: { "pt-BR": "gerenciar-plugins" },
      descriptionLocalizations: { "pt-BR": "Adiciona um plugin ao servidor." },
      options: [],
    });
  }

  async execute(interaction: CommandInteraction) {
    if (!interaction.inCachedGuild()) return;
    const user = await UserService.getOrCreateUser(interaction.user.id);
    const translate = user.getTranslateFunction();
    if (interaction.user.id !== interaction.guild.ownerId) {
      await interaction.reply({
        content: translate("mustBeServerOwner"),
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true, fetchReply: true });

    const server = await ServerService.getOrCreateServer(interaction.guild.id);
    const currentServerPlugins = server.getPlugins();
    const getPluginStatusFields = (serverPlugins: Plugin[]) => {
      return [
        {
          name: translate("currentPlugins"),
          value: serverPlugins.map((plugin) => plugin.name).join(", "),
        },
        {
          name: translate("availablePlugins"),
          value: bot.availablePlugins
            .filter((plugin) => !serverPlugins.find((serverPlugin) => serverPlugin.name === plugin.name))
            .map((plugin) => {
              const label = user.preferredLanguage === "pt-BR" ? plugin.nameLocalizations["pt-BR"] : plugin.name;
              if (!label) {
                throw new Error(`Plugin ${plugin.name} does not have a pt-BR localization.`);
              }
              return label;
            })
            .join(", "),
        },
      ];
    };
    const addPluginPanel: APIEmbed = {
      title: translate("addPluginPanelTitle"),
      description: translate("addPluginPanelDescription"),
      color: resolveColor(CommonService.getRandomColor() as HexColorString),
      author: {
        name: bot.user?.username ?? "Bot",
        icon_url: bot.user?.avatarURL() ?? undefined,
      },
      fields: getPluginStatusFields(currentServerPlugins),
    };
    const getPluginButtons = (plugins: Plugin[]) =>
      bot.availablePlugins.map((botPlugin) => {
        const label = user.preferredLanguage === "pt-BR" ? botPlugin.nameLocalizations["pt-BR"] : botPlugin.name;
        if (!label) {
          throw new Error(`Plugin ${botPlugin.name} does not have a pt-BR localization.`);
        }
        const alreadyHasPlugin = plugins.find((plugin) => plugin.name === botPlugin.name);
        return new Button({
          customId: botPlugin.name,
          style: alreadyHasPlugin ? ButtonStyle.Danger : ButtonStyle.Success,
          label: alreadyHasPlugin
            ? translate("removePlugin", { pluginName: botPlugin.name })
            : translate("addPlugin", { pluginName: botPlugin.name }),
          async onClick(buttonInteraction) {
            if (!buttonInteraction.inCachedGuild()) return;
            await buttonInteraction.deferUpdate();
            if (buttonInteraction.customId === botPlugin.name) {
              if (alreadyHasPlugin) {
                await ServerService.updateServer(server.removePlugin(botPlugin.name));
                await buttonInteraction.editReply({ content: translate("pluginRemoved") });
                for (const removedPluginCommandData of botPlugin.getCommands()) {
                  const toRemove = interaction.guild.commands.cache.find(
                    (command) => command.name === removedPluginCommandData.name,
                  );
                  if (toRemove) await toRemove.delete();
                }
              } else {
                await ServerService.updateServer(server.addPlugin(botPlugin.name));
                for (const addedPluginCommandData of botPlugin.getCommands()) {
                  await interaction.guild.commands.create(addedPluginCommandData);
                }
                await buttonInteraction.editReply({
                  content: translate("pluginAdded", {
                    pluginName: botPlugin.name,
                  }),
                });
              }
            }
            const updatedServer = await ServerService.getOrCreateServer(buttonInteraction.guildId);
            const updatedServerPlugins = updatedServer.getPlugins();
            addPluginPanel.description = (
              user.preferredLanguage === "pt-BR"
                ? botPlugin.exampleParagraphsLocalizations["pt-BR"]
                : botPlugin.exampleParagraphs
            )?.join("\n");
            addPluginPanel.title =
              user.preferredLanguage === "pt-BR" ? botPlugin.nameLocalizations["pt-BR"] : botPlugin.name;
            addPluginPanel.fields = [
              {
                name: translate("pluginAuthor"),
                value: botPlugin.author,
              },
              {
                name: translate("pluginDescription"),
                value:
                  (user.preferredLanguage === "pt-BR"
                    ? botPlugin.descriptionLocalizations["pt-BR"]
                    : botPlugin.description) ?? "No description provided.",
              },
              ...getPluginStatusFields(updatedServerPlugins),
            ];
            await interaction.editReply({
              embeds: [addPluginPanel],
              components: [],
            });
          },
        });
      });
    const pluginButtons = getPluginButtons(currentServerPlugins);
    const reply = await interaction.editReply({
      embeds: [addPluginPanel],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          getPluginButtons(currentServerPlugins).map((button) => button.getAPIComponent()),
        ),
      ],
    });
    const buttonCollector = reply.createMessageComponentCollector({
      filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
      time: Duration.fromObject({ minutes: 5 }).as("milliseconds"),
      componentType: ComponentType.Button,
    });
    buttonCollector.on("collect", async (buttonInteraction) => {
      const pluginButton = pluginButtons.find((button) => button.customId === buttonInteraction.customId);
      if (pluginButton) {
        await pluginButton.onClick?.(buttonInteraction);
      }
    });
  }
}
