CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authorId` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authorId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`imageUrl` text
);
--> statement-breakpoint
CREATE TABLE `itemsCharacters` (
	`itemId` text PRIMARY KEY NOT NULL,
	`characterId` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`isEquipped` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`joinedBotAt` integer,
	`level` integer DEFAULT 1 NOT NULL,
	`exp` integer DEFAULT 0 NOT NULL
);
