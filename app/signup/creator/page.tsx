import RoleSignup from "../role-signup";
export const metadata = { title: "クリエイター登録 | Find Good" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <RoleSignup role="creator" error={error} />;
}
