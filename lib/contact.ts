import { z } from "zod";
export const contactInput = z
  .object({
    profileId: z.string().uuid(),
    message: z.string().trim().min(20).max(3000),
    consent: z.literal(true),
  })
  .strict();
export const statuses = [
  "pending",
  "approved",
  "declined",
  "forwarded",
] as const;
export type ContactStatus = (typeof statuses)[number];
export const statusLabels: Record<ContactStatus, string> = {
  pending: "未確認",
  approved: "承認",
  declined: "見送り",
  forwarded: "取次済み",
};
export const reviewInput = z
  .object({
    id: z.string().uuid(),
    previousStatus: z.enum(statuses),
    status: z.enum(statuses),
    adminNote: z.string().trim().max(2000),
  })
  .strict();
export function canTransition(from: ContactStatus, to: ContactStatus) {
  return (
    from === to ||
    (from === "pending" && (to === "approved" || to === "declined")) ||
    (from === "approved" && (to === "forwarded" || to === "declined"))
  );
}
export function isAdminId(
  id: string | undefined,
  configured: string | undefined,
) {
  return (
    !!id &&
    (configured ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(id)
  );
}
