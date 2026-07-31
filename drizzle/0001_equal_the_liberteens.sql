CREATE TABLE "chapters" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"media_id" varchar(128) NOT NULL,
	"source_chapter_id" text NOT NULL,
	"chapter_number" real NOT NULL,
	"title" text,
	"released_at" timestamp,
	"page_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_reactions" (
	"user_id" varchar(64) NOT NULL,
	"comment_id" varchar(64) NOT NULL,
	"reaction_type" varchar(16) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_reactions_user_id_comment_id_pk" PRIMARY KEY("user_id","comment_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"media_id" varchar(128) NOT NULL,
	"content_type" varchar(16) DEFAULT 'media' NOT NULL,
	"content_id" varchar(128),
	"parent_comment_id" varchar(64),
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_list_items" (
	"list_id" varchar(64) NOT NULL,
	"media_id" varchar(128) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_list_items_list_id_media_id_pk" PRIMARY KEY("list_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "custom_lists" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"media_id" varchar(128) NOT NULL,
	"source_episode_id" text NOT NULL,
	"episode_number" real NOT NULL,
	"title" text,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "content_number" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "user_rating" real;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "last_page_number" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "user_progress" ADD COLUMN "completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auto_skip_intro" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_list_id_custom_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."custom_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_lists" ADD CONSTRAINT "custom_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;