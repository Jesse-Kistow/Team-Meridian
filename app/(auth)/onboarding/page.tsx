import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import OnboardingForm from "./OnboardingForm";

export default function Page() {
  return (
    <AuthShell>
      <Suspense>
        <OnboardingForm />
      </Suspense>
    </AuthShell>
  );
}