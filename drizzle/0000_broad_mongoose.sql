CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authorId` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categoriesToCharacters` (
	`categoryId` text NOT NULL,
	`characterId` text NOT NULL,
	PRIMARY KEY(`categoryId`, `characterId`),
	FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `characterServerData` (
	`characterId` integer NOT NULL,
	`serverId` text NOT NULL,
	`money` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`characterId`, `serverId`),
	FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authorId` text NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`exp` integer DEFAULT 0 NOT NULL,
	`age` integer DEFAULT 18 NOT NULL,
	`imageUrl` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP),
	`birthday` text,
	`backstory` text,
	`personality` text,
	`appearance` text,
	`race` text,
	`gender` text,
	`pronouns` text,
	`title` text,
	`lastPostAt` integer DEFAULT (CURRENT_TIMESTAMP),
	`lastExpGainAt` integer DEFAULT (CURRENT_TIMESTAMP),
	`embedColor` text
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
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itemId` text NOT NULL,
	`characterId` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`isEquipped` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`messageId` text PRIMARY KEY NOT NULL,
	`channelId` text NOT NULL,
	`guildId` text NOT NULL,
	`content` text NOT NULL,
	`authorId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `postsToCharacters` (
	`postId` text NOT NULL,
	`characterId` integer NOT NULL,
	PRIMARY KEY(`characterId`, `postId`),
	FOREIGN KEY (`postId`) REFERENCES `posts`(`messageId`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` text PRIMARY KEY NOT NULL,
	`moneyPluginEnabled` integer DEFAULT false NOT NULL,
	`dndPluginEnabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userServerData` (
	`userId` text NOT NULL,
	`serverId` text NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`lastStreakAt` integer DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`serverId`, `userId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`joinedBotAt` integer DEFAULT (CURRENT_TIMESTAMP),
	`level` integer DEFAULT 1 NOT NULL,
	`preferredLanguage` text DEFAULT 'en-US' NOT NULL,
	`exp` integer DEFAULT 0 NOT NULL,
	`currentCharacterId` integer
);
--> statement-breakpoint
CREATE TABLE `usersToCharacters` (
	`userId` text NOT NULL,
	`characterId` integer NOT NULL,
	PRIMARY KEY(`characterId`, `userId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
