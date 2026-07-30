CREATE TABLE "bookmarks" (
	"user_id" varchar(64) NOT NULL,
	"media_id" varchar(128) NOT NULL,
	"folder" varchar(32) DEFAULT 'bookmarks' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_media_id_pk" PRIMARY KEY("user_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"source_id" varchar(64) NOT NULL,
	"source_title_id" text NOT NULL,
	"title" text NOT NULL,
	"japanese_title" text,
	"type" varchar(16) NOT NULL,
	"cover_image" text,
	"banner_image" text,
	"description" text,
	"rating" real DEFAULT 4.8,
	"status" varchar(32) DEFAULT 'RELEASING',
	"genres" text[],
	"total_chapters" integer,
	"total_episodes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"media_id" varchar(128) NOT NULL,
	"content_type" varchar(16) NOT NULL,
	"content_id" varchar(128) NOT NULL,
	"content_number" integer NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"time_marker_seconds" integer DEFAULT 0,
	"last_read_or_watched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"handle" varchar(100) NOT NULL,
	"avatar" text,
	"chapters_read" integer DEFAULT 0 NOT NULL,
	"hours_watched" integer DEFAULT 0 NOT NULL,
	"reading_streak_days" integer DEFAULT 1 NOT NULL,
	"preferred_reader_mode" varchar(32) DEFAULT 'continuous' NOT NULL,
	"preferred_stream_quality" varchar(16) DEFAULT '1080p' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;