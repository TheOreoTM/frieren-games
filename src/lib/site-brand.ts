export type SiteBrandKey = "default" | "nyamon";

export type SiteBrand = {
  key: SiteBrandKey;
  name: string;
  shortName: string;
  tagline: string;
  markPath: string;
  iconPath: string;
};

export const SITE_BRANDS: Record<SiteBrandKey, SiteBrand> = {
  default: {
    key: "default",
    name: "Magic in Passing",
    shortName: "Magic",
    tagline: "Small games from a long journey.",
    markPath: "/brand/magic-in-passing-mark.png",
    iconPath: "/brand/magic-in-passing-icon.png",
  },
  nyamon: {
    key: "nyamon",
    name: "Nyamon in Passing",
    shortName: "Nyamon",
    tagline: "Small games from a long journey.",
    markPath: "/brand/nyamon-magic-in-passing-mark.png",
    iconPath: "/brand/nyamon-magic-in-passing-icon.png",
  },
};

// Recurring UTC dates use MM-DD keys. Add another entry here for a yearly occasion.
const RECURRING_BRAND_SCHEDULE: Partial<Record<string, SiteBrandKey>> = {
  "04-01": "nyamon",
};

function isSiteBrandKey(value: string | undefined): value is SiteBrandKey {
  return value === "default" || value === "nyamon";
}

export function resolveSiteBrand(
  date = new Date(),
  override = process.env.NEXT_PUBLIC_SITE_BRAND_OVERRIDE,
): SiteBrand {
  if (isSiteBrandKey(override)) return SITE_BRANDS[override];

  const recurringDate = `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
  const scheduledBrand = RECURRING_BRAND_SCHEDULE[recurringDate];

  return SITE_BRANDS[scheduledBrand ?? "default"];
}
