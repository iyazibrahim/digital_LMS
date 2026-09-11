import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllowSignup } from "@/lib/public-access";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const allowSignup = await getAllowSignup();

  if (!allowSignup) {
    return (
      <div className="mx-auto flex max-w-md px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Registration is closed</CardTitle>
            <CardDescription>
              New accounts are created by an administrator. If you already have an account, log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Log in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RegisterForm />;
}
