CREATE TABLE `posts` (
	`messageId` text PRIMARY KEY NOT NULL,
	`channelId` text NOT NULL,
	`guildId` text NOT NULL,
	`content` text NOT NULL,
	`authorId` text NOT NULL
);
