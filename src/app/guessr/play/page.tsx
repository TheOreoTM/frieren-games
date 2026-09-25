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
import { getUnlimitedXpToday } from "@/features/progression/server/progression";
import {
  advanceUnlimitedRound,
  startUnlimitedGame,
  submitUnlimitedGuess,
} from "../actions";

export const metadata: Metadata = {
  title: "Play FrierenGuessr | Magic in Passing",
};

export default async function UnlimitedPlayPage() {
  const session = await readUnlimitedSession();
  if (!session) redirect("/guessr");

  if (session.currentRound === STANDARD_ROUND_COUNT) {
    const account = await auth();
    const unlimitedXp = account?.user?.id
      ? await getUnlimitedXpToday(account.user.id)
      : null;
    return (
      <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
        <GameResults
          results={await getGameResults(session)}
          modeLabel="Unlimited complete"
          action={startUnlimitedGame}
          actionLabel="Play again"
          progressionNote={
            unlimitedXp
              ? `Unlimited XP today: ${unlimitedXp.earned} / ${unlimitedXp.cap}`
              : undefined
          }
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
