import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  joinedBotAt: integer("joinedBotAt", { mode: "timestamp_ms" }),
  level: integer("level").notNull().default(1),
  preferredLanguage: text("preferredLanguage", { enum: ["en-US", "pt-BR"] })
    .notNull()
    .default("en-US"),
  exp: integer("exp").notNull().default(0),
  currentCharacterId: integer("currentCharacterId"),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  characters: many(characters),
  posts: many(posts),
  currentCharacter: one(characters, {
    fields: [users.currentCharacterId],
    references: [characters.id],
  }),
}));

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("authorId").notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  age: integer("age").notNull().default(18),
  imageUrl: text("imageUrl").notNull(),

  birthday: integer("birthday", { mode: "timestamp_ms" }),
  backstory: text("backstory"),
  personality: text("personality"),
  appearance: text("appearance"),
  race: text("race"),
  gender: text("gender"),
  pronouns: text("pronouns"),
  title: text("title"),
  embedColor: text("embedColor"),
});

export const charactersRelations = relations(characters, ({ one, many }) => ({
  author: one(users, {
    fields: [characters.authorId],
    references: [users.id],
  }),
  currentUsers: many(users),
  categories: many(categoriesToCharacters),
  posts: many(postsToCharacters),
  items: many(itemsCharacters),
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
      .references(() => categories.id),
    characterId: text("characterId")
      .notNull()
      .references(() => characters.id),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.categoryId, table.characterId] }),
  })
);

export const categoriesToCharactersRelations = relations(
  categoriesToCharacters,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoriesToCharacters.categoryId],
      references: [categories.id],
    }),
    character: one(characters, {
      fields: [categoriesToCharacters.characterId],
      references: [characters.id],
    }),
  })
);

export const postsToCharacters = sqliteTable(
  "postsToCharacters",
  {
    postId: text("postId")
      .notNull()
      .references(() => posts.messageId),
    characterId: text("characterId")
      .notNull()
      .references(() => characters.id),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.postId, table.characterId] }),
  })
);

export const postsToCharactersRelations = relations(
  postsToCharacters,
  ({ one }) => ({
    post: one(posts, {
      fields: [postsToCharacters.postId],
      references: [posts.messageId],
    }),
    character: one(characters, {
      fields: [postsToCharacters.characterId],
      references: [characters.id],
    }),
  })
);

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
  isEquipped: integer("isEquipped", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const itemsCharactersRelations = relations(
  itemsCharacters,
  ({ one }) => ({
    item: one(items, {
      fields: [itemsCharacters.itemId],
      references: [items.id],
    }),
    character: one(characters, {
      fields: [itemsCharacters.characterId],
      references: [characters.id],
    }),
  })
);

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
