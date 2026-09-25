import type { MetadataRoute } from "next";

const routes = ["", "/guessr", "/leaderboards/guessr", "/legal"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://frieren.oreotm.xyz${route}`,
    changeFrequency: route === "/leaderboards/guessr" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/guessr" ? 0.9 : 0.7,
  }));
}
