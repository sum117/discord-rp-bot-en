import type { ChatInputCommandInteraction } from "discord.js";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

import Plugin, { type PluginCommand } from "../models/Plugin";
import CharacterService from "../services/characterService";
import { ServerService } from "../services/serverService";
import UserService from "../services/userService";

async function getEconomicDataFromInteraction(interaction: ChatInputCommandInteraction) {
  const discordUser = interaction.options.getUser("user", true);
  const user = await UserService.getOrCreateUser(discordUser.id);
  const translate = user.getTranslateFunction();

  const amount = interaction.options.getNumber("amount", true);
  const { character } = (await CharacterService.getCurrentCharacterByUserId(discordUser.id)) ?? {};
  return { amount, character, translate };
}

async function handleMoneyCommand(
  interaction: ChatInputCommandInteraction,
  dependencyKey: "add-money" | "remove-money",
) {
  const dependenciesMap = {
    "add-money": {
      databaseFn: CharacterService.addCharacterMoney,
      translateKey: "moneyAdded",
    },
    "remove-money": {
      databaseFn: CharacterService.removeCharacterMoney,
      translateKey: "moneyRemoved",
    },
  } as const;
  if (!interaction.inCachedGuild()) {
    return;
  }
  await interaction.deferReply({ ephemeral: true });
  const { amount, character, translate } = await getEconomicDataFromInteraction(interaction);
  if (amount <= 0) {
    await interaction.editReply(translate("invalidAmount"));
    return;
  }
  const dependency = dependenciesMap[dependencyKey];
  if (!character) {
    await interaction.editReply(translate("userNoCharacter"));
    return;
  }
  await dependency.databaseFn({ characterId: character.id, amount, serverId: interaction.guild.id });
  await interaction.editReply(translate(dependency.translateKey, { amount, characterName: character.name }));
}

const addMoneyCommand: PluginCommand = {
  name: "add-money",
  nameLocalizations: { "pt-BR": "adicionar-dinheiro" },
  description: "Add money to a character.",
  descriptionLocalizations: { "pt-BR": "Adiciona dinheiro para um personagem do servidor." },
  options: [
    {
      name: "user",
      nameLocalizations: { "pt-BR": "usuario" },
      description: "The user with the character you want to add money to.",
      descriptionLocalizations: { "pt-BR": "O usuário com o personagem que você quer adicionar dinheiro." },
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "amount",
      nameLocalizations: { "pt-BR": "quantidade" },
      description: "The amount of money you want to add.",
      descriptionLocalizations: { "pt-BR": "A quantidade de dinheiro que você quer adicionar." },
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  async execute(interaction: ChatInputCommandInteraction) {
    await handleMoneyCommand(interaction, "add-money");
  },
};

const removeMoneyCommand: PluginCommand = {
  name: "remove-money",
  nameLocalizations: {
    "pt-BR": "remover-dinheiro",
  },
  description: "Remove money from a character.",
  descriptionLocalizations: {
    "pt-BR": "Remove dinheiro de um personagem do servidor.",
  },

  options: [
    {
      name: "user",
      nameLocalizations: { "pt-BR": "usuario" },
      description: "The user with the character you want to remove money from.",
      descriptionLocalizations: { "pt-BR": "O usuário com o personagem para remover o dinheiro." },
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "amount",
      nameLocalizations: { "pt-BR": "quantidade" },
      description: "The amount of money you want to remove.",
      descriptionLocalizations: { "pt-BR": "A quantidade de dinheiro que você quer remover." },
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  async execute(interaction) {
    await handleMoneyCommand(interaction, "remove-money");
  },
};

const giveMoneyCommand: PluginCommand = {
  name: "give-money",
  nameLocalizations: {
    "pt-BR": "dar-dinheiro",
  },
  description: "Give money to a character.",
  descriptionLocalizations: {
    "pt-BR": "Dá dinheiro para um personagem do servidor.",
  },
  options: [
    {
      name: "user",
      nameLocalizations: { "pt-BR": "usuario" },
      description: "The user with the character you want to give money to.",
      descriptionLocalizations: { "pt-BR": "O usuário com o personagem para qual você quer dar dinheiro." },
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "amount",
      nameLocalizations: { "pt-BR": "quantidade" },
      description: "The amount of money you want to add.",
      descriptionLocalizations: { "pt-BR": "A quantidade de dinheiro que você quer dar." },
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }
    await interaction.deferReply({ ephemeral: true });

    const { amount, character: targetCharacter, translate } = await getEconomicDataFromInteraction(interaction);
    if (amount <= 0) {
      await interaction.editReply(translate("invalidAmount"));
      return;
    }
    if (!targetCharacter) {
      await interaction.editReply(translate("userNoCharacter"));
      return;
    }
    const hostCurrentCharacter = await CharacterService.getCurrentCharacterByUserId(interaction.user.id);
    if (!hostCurrentCharacter) {
      await interaction.editReply(translate("noCurrentCharacter"));
      return;
    }

    const hostCharacterServerData = await ServerService.getOrCreateCharacterServerData(
      hostCurrentCharacter.character.id,
      interaction.guild.id,
    );

    if (hostCharacterServerData.money < amount) {
      await interaction.editReply(translate("notEnoughMoney"));
      return;
    }

    await CharacterService.giveCharacterMoney({
      hasPermission: hostCharacterServerData.money >= amount && hostCurrentCharacter.author.id === interaction.user.id,
      serverId: interaction.guild.id,
      amount,
      hostCharacterId: hostCurrentCharacter.character.id,
      targetCharacterId: targetCharacter.id,
    });
    await interaction.editReply(
      translate("moneyGiven", {
        amount,
        targetCharacterName: targetCharacter.name,
        hostCharacterName: hostCurrentCharacter.character.name,
      }),
    );
  },
};

export const moneyPlugin = new Plugin({
  async onBeforeShowCharacterProfile(messageOptions, character, user, server) {
    const embed = messageOptions.embeds?.at(0);
    if (!embed) {
      return;
    }
    const builder = EmbedBuilder.from(embed);
    const money = await CharacterService.getCharacterMoney({ characterId: character.id, serverId: server.id });
    const translate = user.getTranslateFunction();
    builder.addFields([
      {
        name: translate("money"),
        value: `**${money}** 🪙`,
      },
    ]);
    messageOptions = { ...messageOptions, embeds: [embed] };
  },
  author: "sum117",
  commands: [addMoneyCommand, removeMoneyCommand, giveMoneyCommand],
  description: "A plugin to manage money in your server. Add and remove money from characters. Set a daily reward.",
  descriptionLocalizations: {
    "pt-BR":
      "Um plugin para gerenciar dinheiro no seu servidor. Adicione e remova dinheiro de personagens. Defina uma recompensa diária.",
  },
  name: "money-plugin",
  nameLocalizations: {
    "pt-BR": "plugin-de-dinheiro",
  },
  exampleParagraphs: [
    "To add money to a character, use `/add-money @character 10`",
    "To give money to a character, use `/give-money @character 10`",
    "To remove money from a character, use `/remove-money @character 10`",
    "To control who has access to the commands, use the permissions system provided by discord in the server settings.",
  ],
  exampleParagraphsLocalizations: {
    "pt-BR": [
      "Para adicionar dinheiro a um personagem, use `/adicionar-dinheiro @user-com-o-personagem 10`",
      "Para dar dinheiro a um personagem, use `/dar-dinheiro @user-com-o-personagem 10`",
      "Para remover dinheiro de um personagem, use `/remover-dinheiro @user-com-o-personagem 10`",
      "Para controlar quem tem acesso aos comandos, use o sistema de permissões fornecido pelo discord nas configurações do servidor.",
    ],
  },
});
