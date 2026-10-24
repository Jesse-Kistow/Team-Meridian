import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Event Aggregator</h1>
      <p>Discover, buy and manage event tickets.</p>
      <Suspense>
        <UserButton />
      </Suspense>
    </main>
  );
}