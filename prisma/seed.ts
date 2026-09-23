import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { episodeSeedData } from "./episode-seed-data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the development database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  for (const episode of episodeSeedData) {
    await prisma.episode.upsert({
      where: {
        season_episodeNumber: {
          season: episode.season,
          episodeNumber: episode.episodeNumber,
        },
      },
      create: episode,
      update: {
        globalOrder: episode.globalOrder,
        title: episode.title,
      },
    });
  }

  console.log(`Seeded ${episodeSeedData.length} episode records.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
