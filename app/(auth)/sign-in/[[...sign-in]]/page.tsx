import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";
import { authAppearance } from "@/components/clerkAppearance";

export default function Page() {
  return (
    <AuthShell altHref="/sign-up" altLabel="Register">
        <Suspense>
            <SignIn appearance={authAppearance} signUpUrl="/sign-up" />
        </Suspense>
    </AuthShell>
  );
}