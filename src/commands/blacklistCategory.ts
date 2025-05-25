import type { ChatInputCommandInteraction } from "discord.js";
import { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } from "discord.js";

import enUS from "../locales/en-US.json";
import ptBr from "../locales/pt-BR.json";
import UserService from "../services/userService";
import { BaseCommand } from "./baseCommand";
import { ServerService } from "@/services/serverService";

export default class BlacklistCategory extends BaseCommand {
    public constructor() {
        super({
            name: enUS.blacklistCategoryCommandName,
            nameLocalizations: { "pt-BR": ptBr.blacklistCategoryCommandName },
            description: enUS.blacklistCategoryCommandDescription,
            descriptionLocalizations: {
                "pt-BR": ptBr.blacklistCategoryCommandDescription,
            },
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: enUS.blacklistCategoryCommandOptionName,
                    description: enUS.blacklistCategoryCommandOptionDescription,
                    nameLocalizations: {
                        "pt-BR": ptBr.blacklistCategoryCommandOptionName,
                    },
                    descriptionLocalizations: {
                        "pt-BR": ptBr.blacklistCategoryCommandOptionDescription,
                    },
                }
            ],
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!interaction.inGuild()) {
            console.log("Someone tried to use the blacklist category command outside of a guild.");
            return;
        }

        const user = await UserService.getOrCreateUser(interaction.user.id);
        const translate = user.getTranslateFunction();

        const hasPermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
            || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
            || interaction.user.id === interaction.guild?.ownerId;
        if (!hasPermission) {
            await interaction.reply({
                content: translate("noPermissionToUseThisCommand"),
                ephemeral: true,
            });
            return;
        }

        const server = await ServerService.getOrCreateServer(interaction.guild!.id);

        const category = interaction.options.getChannel("category");
        if (!category || category.type !== ChannelType.GuildCategory) {
            console.log("Invalid category provided for blacklist command.");
            await interaction.reply({
                content: translate("invalidCategory"),
                ephemeral: true,
            });
            return;
        }

        const isAlreadyBlacklisted = server.blacklistedCategoriesArray.includes(category.id);
        if (!isAlreadyBlacklisted) {
            server.blacklistedCategoriesArray = [...server.blacklistedCategoriesArray, category.id];
            await ServerService.updateServer(server);
            await interaction.reply({
                content: translate("categoryBlacklisted", {
                    category: category.name,
                }),
                ephemeral: true,
            });
        } else {
            server.blacklistedCategoriesArray = server.blacklistedCategoriesArray.filter(id => id !== category.id);
            await ServerService.updateServer(server);
            await interaction.reply({
                content: translate("categoryUnblacklisted", {
                    category: category.name,
                }),
                ephemeral: true,
            });
        }

    }
}
