"use client";

import { useActionState } from "react";

import { completeOnboarding, type OnboardingActionState } from "./actions";

const initialState: OnboardingActionState = {};

export function OnboardingForm({
  defaultUsername,
  defaultDisplayName,
}: {
  defaultUsername: string;
  defaultDisplayName: string;
}) {
  const [state, action, pending] = useActionState(
    completeOnboarding,
    initialState,
  );

  return (
    <form action={action} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-semibold">
        Username
        <input
          className="admin-input"
          name="username"
          defaultValue={defaultUsername}
          minLength={3}
          maxLength={24}
          autoComplete="username"
          aria-describedby="username-help username-error"
          aria-invalid={Boolean(state.errors?.username)}
          required
        />
        <span
          id="username-help"
          className="text-muted text-xs leading-5 font-normal"
        >
          Your unique public name. Lowercase letters, numbers, hyphens, and
          underscores only.
        </span>
        {state.errors?.username ? (
          <span
            id="username-error"
            className="text-sm font-normal text-red-700 dark:text-red-300"
          >
            {state.errors.username[0]}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Display name
        <input
          className="admin-input"
          name="displayName"
          defaultValue={defaultDisplayName}
          maxLength={40}
          autoComplete="name"
          aria-describedby="display-name-error"
          aria-invalid={Boolean(state.errors?.displayName)}
          required
        />
        {state.errors?.displayName ? (
          <span
            id="display-name-error"
            className="text-sm font-normal text-red-700 dark:text-red-300"
          >
            {state.errors.displayName[0]}
          </span>
        ) : null}
      </label>

      {state.message ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-sage mt-2 rounded-xl px-6 py-3.5 font-semibold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue to FrierenGuessr"}
      </button>
    </form>
  );
}
