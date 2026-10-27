CREATE TABLE "contact_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"reviewed_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_request_requester_profile_unique" ON "contact_requests" USING btree ("requester_id","profile_id");