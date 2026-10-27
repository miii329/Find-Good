import "server-only";
import { getDb } from "@/db";
import { creatorRegistrations, seekerRegistrations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { roleFromRegistrations } from "./registration";
export async function getRegistration(userId: string) {
  const [row] = await getDb()
    .select({
      creator: creatorRegistrations.userId,
      seeker: seekerRegistrations.userId,
    })
    .from(users)
    .leftJoin(creatorRegistrations, eq(creatorRegistrations.userId, users.id))
    .leftJoin(seekerRegistrations, eq(seekerRegistrations.userId, users.id))
    .where(eq(users.id, userId));
  const role = roleFromRegistrations(!!row?.creator, !!row?.seeker);
  return role ? { role } : undefined;
}
