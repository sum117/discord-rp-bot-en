import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  joinedBotAt: integer("joinedBotAt", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  level: integer("level").notNull().default(1),
  preferredLanguage: text("preferredLanguage", { enum: ["en-US", "pt-BR"] })
    .notNull()
    .default("en-US"),
  exp: integer("exp").notNull().default(0),
  currentCharacterId: integer("currentCharacterId"),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  characters: many(usersToCharacters),
  authoredCharacters: many(characters, {
    relationName: "author",
  }),
  posts: many(posts),
  currentCharacter: one(characters, {
    relationName: "currentCharacter",
    fields: [users.currentCharacterId],
    references: [characters.id],
  }),
  serverData: many(userServerData),
}));

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("authorId").notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  age: integer("age").notNull().default(18),
  imageUrl: text("imageUrl").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  birthday: text("birthday"),
  backstory: text("backstory"),
  personality: text("personality"),
  appearance: text("appearance"),
  race: text("race"),
  gender: text("gender"),
  pronouns: text("pronouns"),
  title: text("title"),
  lastPostAt: integer("lastPostAt", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  lastExpGainAt: integer("lastExpGainAt", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  embedColor: text("embedColor"),
});

export const charactersRelations = relations(characters, ({ one, many }) => ({
  author: one(users, {
    relationName: "author",
    fields: [characters.authorId],
    references: [users.id],
  }),
  ownedBy: many(usersToCharacters),
  currentUsers: many(users, {
    relationName: "currentCharacter",
  }),
  serverData: many(characterServerData),
  categories: many(categoriesToCharacters),
  posts: many(postsToCharacters),
  items: many(itemsCharacters),
}));

export const servers = sqliteTable("servers", {
  id: text("id").primaryKey(),
  moneyPluginEnabled: integer("moneyPluginEnabled", { mode: "boolean" }).notNull().default(false),
  dndPluginEnabled: integer("dndPluginEnabled", { mode: "boolean" }).notNull().default(false),
});

export const characterServerData = sqliteTable(
  "characterServerData",
  {
    characterId: integer("characterId")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    serverId: text("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    money: integer("money").notNull().default(0),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.characterId, table.serverId] }),
  }),
);

export const characterServerDataRelations = relations(characterServerData, ({ one }) => ({
  character: one(characters, {
    fields: [characterServerData.characterId],
    references: [characters.id],
  }),
  server: one(servers, {
    fields: [characterServerData.serverId],
    references: [servers.id],
  }),
}));

export const userServerData = sqliteTable(
  "userServerData",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    serverId: text("serverId")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    streak: integer("streak").notNull().default(0),
    lastStreakAt: integer("lastStreakAt", { mode: "timestamp_ms" }).default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.userId, table.serverId] }),
  }),
);

export const userServerDataRelations = relations(userServerData, ({ one }) => ({
  user: one(users, {
    fields: [userServerData.userId],
    references: [users.id],
  }),
  server: one(servers, {
    fields: [userServerData.serverId],
    references: [servers.id],
  }),
}));

export const usersToCharacters = sqliteTable(
  "usersToCharacters",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: integer("characterId")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.userId, table.characterId] }),
  }),
);

export const usersToCharactersRelations = relations(usersToCharacters, ({ one }) => ({
  user: one(users, {
    fields: [usersToCharacters.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [usersToCharacters.characterId],
    references: [characters.id],
  }),
}));
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("authorId").notNull(),
  name: text("name").notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  author: one(users, {
    fields: [categories.authorId],
    references: [users.id],
  }),
  characters: many(categoriesToCharacters),
}));

export const categoriesToCharacters = sqliteTable(
  "categoriesToCharacters",
  {
    categoryId: text("categoryId")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    characterId: text("characterId")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.categoryId, table.characterId] }),
  }),
);

export const categoriesToCharactersRelations = relations(categoriesToCharacters, ({ one }) => ({
  category: one(categories, {
    fields: [categoriesToCharacters.categoryId],
    references: [categories.id],
  }),
  character: one(characters, {
    fields: [categoriesToCharacters.characterId],
    references: [characters.id],
  }),
}));

export const postsToCharacters = sqliteTable(
  "postsToCharacters",
  {
    postId: text("postId")
      .notNull()
      .references(() => posts.messageId, { onDelete: "cascade" }),
    characterId: integer("characterId")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.postId, table.characterId] }),
  }),
);

export const postsToCharactersRelations = relations(postsToCharacters, ({ one }) => ({
  post: one(posts, {
    fields: [postsToCharacters.postId],
    references: [posts.messageId],
  }),
  character: one(characters, {
    fields: [postsToCharacters.characterId],
    references: [characters.id],
  }),
}));

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("authorId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
  author: one(users, {
    fields: [items.authorId],
    references: [users.id],
  }),
}));

export const itemsCharacters = sqliteTable("itemsCharacters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: text("itemId").notNull(),
  characterId: text("characterId").notNull(),
  quantity: integer("quantity").notNull().default(0),
  isEquipped: integer("isEquipped", { mode: "boolean" }).notNull().default(false),
});

export const itemsCharactersRelations = relations(itemsCharacters, ({ one }) => ({
  item: one(items, {
    fields: [itemsCharacters.itemId],
    references: [items.id],
  }),
  character: one(characters, {
    fields: [itemsCharacters.characterId],
    references: [characters.id],
  }),
}));

export const posts = sqliteTable("posts", {
  messageId: text("messageId").primaryKey(),
  channelId: text("channelId").notNull(),
  guildId: text("guildId").notNull(),
  content: text("content").notNull(),
  authorId: text("authorId").notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  characters: many(postsToCharacters),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
