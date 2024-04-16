CREATE TABLE `characterServerData` (
	`characterId` integer NOT NULL,
	`serverId` text NOT NULL,
	`money` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`characterId`, `serverId`),
	FOREIGN KEY (`characterId`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serverId`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade
);
