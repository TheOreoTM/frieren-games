import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GameResults } from "@/features/guessr/components/game-results";
import { GameRound } from "@/features/guessr/components/game-round";
import {
  getGameResults,
  getRoundPageData,
} from "@/features/guessr/server/game";
import { readUnlimitedSession } from "@/features/guessr/server/session";
import { STANDARD_ROUND_COUNT } from "@/features/guessr/domain/score";
import { getUnlimitedGameProgression } from "@/features/progression/server/progression";
import {
  advanceUnlimitedRound,
  startUnlimitedGame,
  submitUnlimitedGuess,
} from "../actions";

export const metadata: Metadata = {
  title: "Play FrierenGuessr",
};

export default async function UnlimitedPlayPage() {
  const session = await readUnlimitedSession();
  if (!session) redirect("/guessr");

  if (session.currentRound === STANDARD_ROUND_COUNT) {
    const account = await auth();
    const [results, progression] = await Promise.all([
      getGameResults(session),
      account?.user?.id
        ? getUnlimitedGameProgression(account.user.id, session.gameId)
        : Promise.resolve(null),
    ]);
    return (
      <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
        <GameResults
          results={results}
          modeLabel="Unlimited complete"
          action={startUnlimitedGame}
          actionLabel="Play again"
          progression={progression ?? undefined}
        />
      </main>
    );
  }

  const round = await getRoundPageData(session);
  if (!round) redirect("/guessr");

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <GameRound
        key={`${round.gameId}-${round.roundNumber}`}
        {...round}
        initialReveal={round.reveal}
        modeLabel="Unlimited"
        submitGuess={submitUnlimitedGuess}
        advanceRound={advanceUnlimitedRound}
      />
    </main>
  );
}
