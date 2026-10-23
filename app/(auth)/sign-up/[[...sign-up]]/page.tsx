import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";
import { authAppearance } from "@/components/clerkAppearance";

export default function Page() {
  return (
    <AuthShell altHref="/sign-in" altLabel="Log in">
      <Suspense>
        <SignUp appearance={authAppearance} signInUrl="/sign-in" />
      </Suspense>
    </AuthShell>
  );
}