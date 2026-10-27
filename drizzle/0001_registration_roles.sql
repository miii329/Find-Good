CREATE TABLE "registrations" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "registrations" ("user_id", "role")
SELECT DISTINCT "owner", 'creator' FROM "profiles"
ON CONFLICT ("user_id") DO NOTHING;
