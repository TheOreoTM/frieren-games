import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, unlink } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { appendManifestRecord, readManifest } from "./manifest";
import {
  createPreviewProxy,
  discoverEpisodes,
  extractFrame,
  probeImage,
} from "./media";
import { runProcess } from "./process";
import { DIFFICULTIES, type Difficulty, type DiscoveredEpisode } from "./types";

const LOOPBACK_HOST = "127.0.0.1";
const DEFAULT_PORT = 4317;
const curatorRoot = fileURLToPath(new URL("..", import.meta.url));
const publicDirectory = path.join(curatorRoot, "public");
const cacheDirectory = path.join(curatorRoot, "cache");
const outputDirectory = path.join(curatorRoot, "output");
const manifestPath = path.join(curatorRoot, "manifest.json");
const staticFiles = new Map([
  ["/", { path: path.join(publicDirectory, "index.html"), type: "text/html; charset=utf-8" }],
  ["/app.js", { path: path.join(publicDirectory, "app.js"), type: "text/javascript; charset=utf-8" }],
  ["/styles.css", { path: path.join(publicDirectory, "styles.css"), type: "text/css; charset=utf-8" }],
]);

function sendJson(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function publicEpisode(episode: DiscoveredEpisode, approvedCounts: Map<string, number>) {
  const episodeKey = episode.episode
    ? `${episode.episode.season}:${episode.episode.episode}`
    : "unmapped";

  return {
    id: episode.id,
    filename: episode.filename,
    relativePath: episode.relativePath,
    season: episode.episode?.season ?? null,
    episode: episode.episode?.episode ?? null,
    durationMs: episode.probe.durationMs,
    width: episode.probe.width,
    height: episode.probe.height,
    videoCodec: episode.probe.videoCodec,
    playback: episode.playback,
    approvedCount: approvedCounts.get(episodeKey) ?? 0,
  };
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  if (request.headers["content-type"]?.split(";", 1)[0] !== "application/json") {
    throw new Error("Expected application/json.");
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw new Error("Request body is too large.");
  }

  return JSON.parse(body);
}

function assertLocalRequest(request: IncomingMessage, expectedOrigin: string) {
  const host = request.headers.host;
  if (host !== expectedOrigin.slice("http://".length)) {
    throw new Error("Unexpected Host header.");
  }

  if (request.method === "POST" && request.headers.origin !== expectedOrigin) {
    throw new Error("Mutation requests must originate from the curator UI.");
  }
}

async function serveFile(
  request: IncomingMessage,
  response: ServerResponse,
  filePath: string,
  contentType: string,
) {
  const fileStats = await stat(filePath);
  const range = request.headers.range;

  if (!range) {
    response.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Content-Length": fileStats.size,
      "Content-Type": contentType,
    });
    createReadStream(filePath).pipe(response);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) {
    response.writeHead(416, { "Content-Range": `bytes */${fileStats.size}` });
    response.end();
    return;
  }

  let start: number;
  let end: number;

  if (!match[1] && match[2]) {
    const suffixLength = Number(match[2]);
    start = Math.max(fileStats.size - suffixLength, 0);
    end = fileStats.size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : fileStats.size - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end >= fileStats.size) {
    response.writeHead(416, { "Content-Range": `bytes */${fileStats.size}` });
    response.end();
    return;
  }

  response.writeHead(206, {
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${fileStats.size}`,
    "Content-Type": contentType,
  });
  createReadStream(filePath, { start, end }).pipe(response);
}

function mediaType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".webm") return "video/webm";
  if (extension === ".mkv") return "video/x-matroska";
  return "video/mp4";
}

async function main() {
  const configuredRoot = process.env.CURATOR_MEDIA_ROOT;
  if (!configuredRoot || !path.isAbsolute(configuredRoot)) {
    throw new Error("CURATOR_MEDIA_ROOT must be an absolute directory path.");
  }

  const mediaRoot = path.resolve(configuredRoot);
  if (!(await stat(mediaRoot)).isDirectory()) {
    throw new Error("CURATOR_MEDIA_ROOT does not point to a directory.");
  }

  const ffmpegPath = process.env.FFMPEG_PATH ?? "ffmpeg";
  const ffprobePath = process.env.FFPROBE_PATH ?? "ffprobe";
  await Promise.all([
    runProcess(ffmpegPath, ["-version"], { quiet: true }),
    runProcess(ffprobePath, ["-version"], { quiet: true }),
  ]);

  await Promise.all([
    mkdir(cacheDirectory, { recursive: true }),
    mkdir(outputDirectory, { recursive: true }),
  ]);

  console.log(`Scanning ${mediaRoot}…`);
  const episodes = await discoverEpisodes(mediaRoot, ffprobePath);
  const episodeById = new Map(episodes.map((episode) => [episode.id, episode]));
  const proxyByEpisodeId = new Map<string, Promise<string>>();
  let manifest = await readManifest(manifestPath);
  let approvalQueue = Promise.resolve();
  const rawPort = Number(process.env.CURATOR_PORT ?? DEFAULT_PORT);
  if (!Number.isSafeInteger(rawPort) || rawPort < 1 || rawPort > 65_535) {
    throw new Error("CURATOR_PORT must be an integer between 1 and 65535.");
  }
  const origin = `http://${LOOPBACK_HOST}:${rawPort}`;

  function ensureProxy(episode: DiscoveredEpisode) {
    const pending = proxyByEpisodeId.get(episode.id);
    if (pending) return pending;

    const created = createPreviewProxy(episode, cacheDirectory, ffmpegPath).catch((error) => {
      proxyByEpisodeId.delete(episode.id);
      throw error;
    });
    proxyByEpisodeId.set(episode.id, created);
    return created;
  }

  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Security-Policy", "default-src 'self'; media-src 'self'; script-src 'self'; style-src 'self'");
    response.setHeader("X-Content-Type-Options", "nosniff");

    try {
      assertLocalRequest(request, origin);
      const url = new URL(request.url ?? "/", origin);

      if (request.method === "GET" && url.pathname === "/api/episodes") {
        const approvedCounts = new Map<string, number>();
        for (const frame of manifest.frames) {
          const key = `${frame.season}:${frame.episode}`;
          approvedCounts.set(key, (approvedCounts.get(key) ?? 0) + 1);
        }
        sendJson(response, 200, {
          episodes: episodes.map((episode) => publicEpisode(episode, approvedCounts)),
          approvedTotal: manifest.frames.length,
        });
        return;
      }

      const previewMatch = /^\/api\/episodes\/([0-9a-f-]+)\/preview$/.exec(url.pathname);
      if (request.method === "POST" && previewMatch) {
        const episode = episodeById.get(previewMatch[1]);
        if (!episode) {
          sendJson(response, 404, { error: "Episode not found." });
          return;
        }

        if (episode.playback === "proxy") await ensureProxy(episode);
        sendJson(response, 200, { mediaUrl: `/media/${episode.id}` });
        return;
      }

      const mediaMatch = /^\/media\/([0-9a-f-]+)$/.exec(url.pathname);
      if (request.method === "GET" && mediaMatch) {
        const episode = episodeById.get(mediaMatch[1]);
        if (!episode) {
          response.writeHead(404).end();
          return;
        }

        const filePath = episode.playback === "source" ? episode.absolutePath : await ensureProxy(episode);
        await serveFile(request, response, filePath, mediaType(filePath));
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/approve") {
        const body = (await readJsonBody(request)) as Record<string, unknown>;
        const episode = typeof body.episodeId === "string" ? episodeById.get(body.episodeId) : undefined;
        const timestampMs = body.timestampMs;
        const difficulty = body.difficulty;

        if (!episode?.episode) throw new Error("Select a mapped episode before approval.");
        if (!Number.isSafeInteger(timestampMs) || (timestampMs as number) < 0 || (timestampMs as number) > episode.probe.durationMs) {
          throw new Error("Timestamp is outside the selected episode.");
        }
        if (!DIFFICULTIES.includes(difficulty as Difficulty)) {
          throw new Error("Difficulty must be EASY, MEDIUM, or HARD.");
        }
        const mappedEpisode = episode.episode;

        const approval = async () => {
          const localId = randomUUID().replaceAll("-", "");
          const outputFilename = `${localId}.webp`;
          const outputPath = path.join(outputDirectory, outputFilename);

          try {
            await extractFrame(
              episode.absolutePath,
              timestampMs as number,
              outputPath,
              ffmpegPath,
            );
            const [imageProbe, imageBytes] = await Promise.all([
              probeImage(outputPath, ffprobePath),
              readFile(outputPath),
            ]);
            const record = {
              localId,
              season: mappedEpisode.season,
              episode: mappedEpisode.episode,
              timestampMs: timestampMs as number,
              difficulty: difficulty as Difficulty,
              sourceFile: episode.relativePath,
              outputFile: path.posix.join("output", outputFilename),
              width: imageProbe.width,
              height: imageProbe.height,
              sha256: createHash("sha256").update(imageBytes).digest("hex"),
              status: "LOCAL_APPROVED" as const,
              createdAt: new Date().toISOString(),
            };
            manifest = await appendManifestRecord(manifestPath, record);
            return record;
          } catch (error) {
            await unlink(outputPath).catch(() => undefined);
            throw error;
          }
        };

        const result = approvalQueue.then(approval, approval);
        approvalQueue = result.then(() => undefined, () => undefined);
        sendJson(response, 201, { frame: await result, approvedTotal: manifest.frames.length });
        return;
      }

      const staticFile = request.method === "GET" ? staticFiles.get(url.pathname) : undefined;
      if (staticFile) {
        await serveFile(request, response, staticFile.path, staticFile.type);
        return;
      }

      response.writeHead(404).end("Not found");
    } catch (error) {
      console.error(error);
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Unexpected curator error.",
      });
    }
  });

  server.listen(rawPort, LOOPBACK_HOST, () => {
    const mappedCount = episodes.filter((episode) => episode.episode).length;
    console.log(`Found ${episodes.length} video file(s); ${mappedCount} mapped to episodes.`);
    console.log(`Curator ready at ${origin}`);
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
