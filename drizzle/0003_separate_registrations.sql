CREATE TABLE "creator_registrations" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seeker_registrations" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_registrations" ADD CONSTRAINT "creator_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeker_registrations" ADD CONSTRAINT "seeker_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "creator_registrations" ("user_id", "created_at")
SELECT "user_id", "created_at" FROM "registrations" WHERE "role" IN ('creator', 'both')
ON CONFLICT ("user_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "seeker_registrations" ("user_id", "created_at")
SELECT "user_id", "created_at" FROM "registrations" WHERE "role" IN ('seeker', 'both')
ON CONFLICT ("user_id") DO NOTHING;
