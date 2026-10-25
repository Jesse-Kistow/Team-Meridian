"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { updateName } from "@/app/(site)/profile/_actions";

type EditNameFormProps = {
  currentName: string;
  onDone: () => void;
};

export default function EditNameForm({ currentName, onDone }: EditNameFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateName(name);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      await user?.reload(); // refreshes the name in the navbar
      router.refresh(); // refreshes the page's own data
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-2xl bg-stone-100 p-4">
      <label htmlFor="profile-name" className="text-xs font-semibold text-neutral-800">
        Name
      </label>
      <input
        id="profile-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={80}
        className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-violet-600"
      />
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-semibold text-zinc-500 hover:text-neutral-800"
        >
          Cancel
        </button>
      </div>
      <button
        type="button"
        onClick={() => openUserProfile()}
        className="mt-4 text-xs font-semibold text-violet-600"
      >
        Change email or password ↗
      </button>
    </form>
  );
}