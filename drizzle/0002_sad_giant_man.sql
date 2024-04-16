CREATE TABLE `servers` (
	`id` text PRIMARY KEY NOT NULL,
	`moneyPluginEnabled` integer DEFAULT false NOT NULL,
	`dndPluginEnabled` integer DEFAULT false NOT NULL
);
