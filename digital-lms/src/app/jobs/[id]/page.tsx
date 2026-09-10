import { redirect } from "next/navigation";

export default async function JobDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/bulletin");
}
