import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/Settings";

/** Public sign-up flag. Defaults to true if settings cannot be loaded. */
export async function getAllowSignup(): Promise<boolean> {
  try {
    await connectDB();
    const settings = await getSettings();
    return settings.allowSignup !== false;
  } catch {
    return true;
  }
}
