CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`authorId` text NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`exp` integer DEFAULT 0 NOT NULL,
	`age` integer DEFAULT 0 NOT NULL,
	`imageUrl` text NOT NULL,
	`birthday` integer,
	`backstory` text,
	`personality` text,
	`appearance` text,
	`race` text,
	`gender` text,
	`pronouns` text,
	`title` text,
	`embedColor` text
);
