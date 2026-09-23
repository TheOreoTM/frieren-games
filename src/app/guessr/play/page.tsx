import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GameResults } from "@/features/guessr/components/game-results";
import { GameRound } from "@/features/guessr/components/game-round";
import {
  getGameResults,
  getRoundPageData,
} from "@/features/guessr/server/game";
import { readUnlimitedSession } from "@/features/guessr/server/session";
import { STANDARD_ROUND_COUNT } from "@/features/guessr/domain/score";

export const metadata: Metadata = {
  title: "Play FrierenGuessr | Frieren Games",
};

export default async function UnlimitedPlayPage() {
  const session = await readUnlimitedSession();
  if (!session) redirect("/guessr");

  if (session.currentRound === STANDARD_ROUND_COUNT) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
        <GameResults results={await getGameResults(session)} />
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
      />
    </main>
  );
}
