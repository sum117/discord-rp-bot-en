import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  joinedBotAt: integer("joinedBotAt", { mode: "timestamp_ms" }),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  posts: many(posts),
}));

export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("authorId").notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  age: integer("age").notNull().default(0),
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
  categories: many(categories),
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
  characters: many(characters),
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
  itemId: text("itemId").primaryKey(),
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
  characters: many(characters),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
