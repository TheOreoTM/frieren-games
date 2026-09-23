export type EpisodeSeedRecord = {
  season: number;
  episodeNumber: number;
  globalOrder: number;
  title: string;
};

const seasonOneTitles = [
  "The Journey's End",
  "It Didn't Have to Be Magic...",
  "Killing Magic",
  "The Land Where Souls Rest",
  "Phantoms of the Dead",
  "The Hero of the Village",
  "Like a Fairy Tale",
  "Frieren the Slayer",
  "Aura the Guillotine",
  "A Powerful Mage",
  "Winter in the Northern Lands",
  "A Real Hero",
  "Aversion to One's Own Kind",
  "Privilege of the Young",
  "Smells Like Trouble",
  "Long-Lived Friends",
  "Take Care",
  "First-Class Mage Exam",
  "Well-Laid Plans",
  "Necessary Killing",
  "The World of Magic",
  "Future Enemies",
  "Conquering the Labyrinth",
  "Perfect Replicas",
  "A Fatal Vulnerability",
  "The Height of Magic",
  "An Era of Humans",
  "It Would Be Embarrassing When We Met Again",
] as const;

const seasonTwoTitles = [
  "Shall We Go, Then?",
  "The Hero of the South",
  "Somewhere She'd Like",
  "Other People's Homes",
  "Logistics in the Northern Plateau",
  "A Demon-Slaying Request",
  "The Divine Revolte",
  "A Magnificent End",
  "Himmel's Memoirs",
  "A Beautiful Sight",
] as const;

function makeSeason(
  season: number,
  titles: readonly string[],
  firstGlobalOrder: number,
): EpisodeSeedRecord[] {
  return titles.map((title, index) => ({
    season,
    episodeNumber: index + 1,
    globalOrder: firstGlobalOrder + index,
    title,
  }));
}

export const episodeSeedData: EpisodeSeedRecord[] = [
  ...makeSeason(1, seasonOneTitles, 1),
  ...makeSeason(2, seasonTwoTitles, 29),
];
