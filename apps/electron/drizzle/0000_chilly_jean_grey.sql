CREATE TABLE `editor_media` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`width` integer,
	`height` integer,
	`duration` integer,
	`size` integer,
	`ephemeral` integer,
	`file_path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `editor_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `editor_media_project_id_idx` ON `editor_media` (`project_id`);--> statement-breakpoint
CREATE TABLE `editor_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`thumbnail` text,
	`background_type` text,
	`background_color` text,
	`blur_intensity` integer,
	`bookmarks_json` text,
	`fps` integer,
	`canvas_mode` text,
	`canvas_width` integer,
	`canvas_height` integer,
	`current_scene_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `editor_projects_updated_at_idx` ON `editor_projects` (`updated_at`);--> statement-breakpoint
CREATE TABLE `editor_saved_sounds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`username` text,
	`preview_url` text,
	`download_url` text,
	`duration` integer,
	`tags_json` text,
	`license` text,
	`saved_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `editor_saved_sounds_saved_at_idx` ON `editor_saved_sounds` (`saved_at`);--> statement-breakpoint
CREATE TABLE `editor_scenes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`is_main` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `editor_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `editor_scenes_project_id_idx` ON `editor_scenes` (`project_id`);--> statement-breakpoint
CREATE INDEX `editor_scenes_is_main_idx` ON `editor_scenes` (`is_main`);--> statement-breakpoint
CREATE TABLE `editor_timelines` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`scene_id` text,
	`tracks_json` text NOT NULL,
	`last_modified` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `editor_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scene_id`) REFERENCES `editor_scenes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `editor_timelines_project_id_idx` ON `editor_timelines` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `editor_timelines_project_id_scene_id_unique` ON `editor_timelines` (`project_id`,`scene_id`);