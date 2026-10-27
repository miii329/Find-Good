import "server-only";
import { auth, isAuthConfigured } from "@/auth";
import { isAdminId } from "./contact";
export async function adminSession() {
  if (!isAuthConfigured()) return null;
  const session = await auth();
  return isAdminId(session?.user.id, process.env.ADMIN_USER_IDS)
    ? session
    : null;
}
