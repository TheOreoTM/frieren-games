import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { parseEpisodeFilename } from "./filename";
import { requirePathInsideRoot } from "./paths";
import { runProcess } from "./process";
import type { DiscoveredEpisode, MediaProbe } from "./types";

const VIDEO_EXTENSIONS = new Set([".mkv", ".mp4", ".m4v", ".webm", ".mov"]);

type FfprobeOutput = {
  format?: { duration?: string; format_name?: string };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    width?: number;
    height?: number;
    duration?: string;
  }>;
};

async function walkMediaFiles(
  root: string,
  directory = root,
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const candidate = requirePathInsideRoot(
      root,
      path.join(directory, entry.name),
    );

    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await walkMediaFiles(root, candidate)));
    } else if (
      entry.isFile() &&
      VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(candidate);
    }
  }

  return files;
}

export async function probeMedia(
  filePath: string,
  ffprobePath: string,
): Promise<MediaProbe> {
  const { stdout } = await runProcess(
    ffprobePath,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration,format_name:stream=codec_type,codec_name,width,height,duration",
      "-of",
      "json",
      filePath,
    ],
    { quiet: true },
  );
  const result = JSON.parse(stdout) as FfprobeOutput;
  const video = result.streams?.find((stream) => stream.codec_type === "video");
  const durationSeconds = Number(result.format?.duration ?? video?.duration);

  if (!video || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error(
      `No usable video stream found in ${path.basename(filePath)}.`,
    );
  }

  return {
    durationMs: Math.round(durationSeconds * 1000),
    width: video.width ?? 0,
    height: video.height ?? 0,
    videoCodec: video.codec_name ?? "unknown",
    formatName: result.format?.format_name ?? "unknown",
  };
}

export async function probeImage(
  filePath: string,
  ffprobePath: string,
): Promise<{ width: number; height: number }> {
  const { stdout } = await runProcess(
    ffprobePath,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "json",
      filePath,
    ],
    { quiet: true },
  );
  const result = JSON.parse(stdout) as FfprobeOutput;
  const image = result.streams?.[0];

  if (!image?.width || !image.height) {
    throw new Error("FFprobe could not read the extracted image dimensions.");
  }

  return { width: image.width, height: image.height };
}

function canPlaySource(filePath: string, probe: MediaProbe): boolean {
  const extension = path.extname(filePath).toLowerCase();

  if (
    (extension === ".mp4" || extension === ".m4v") &&
    probe.videoCodec === "h264"
  ) {
    return true;
  }

  return (
    extension === ".webm" && ["vp8", "vp9", "av1"].includes(probe.videoCodec)
  );
}

export async function discoverEpisodes(
  mediaRoot: string,
  ffprobePath: string,
): Promise<DiscoveredEpisode[]> {
  const files = await walkMediaFiles(mediaRoot);
  const episodes: DiscoveredEpisode[] = [];

  for (const absolutePath of files.sort((left, right) =>
    left.localeCompare(right),
  )) {
    const probe = await probeMedia(absolutePath, ffprobePath);
    const relativePath = path.relative(mediaRoot, absolutePath);

    episodes.push({
      id: randomUUID(),
      absolutePath,
      relativePath,
      filename: path.basename(absolutePath),
      episode: parseEpisodeFilename(relativePath),
      probe,
      playback: canPlaySource(absolutePath, probe) ? "source" : "proxy",
    });
  }

  return episodes.sort((left, right) => {
    if (left.episode && right.episode) {
      return (
        left.episode.season - right.episode.season ||
        left.episode.episode - right.episode.episode
      );
    }
    if (left.episode) return -1;
    if (right.episode) return 1;
    return left.filename.localeCompare(right.filename);
  });
}

export async function createPreviewProxy(
  episode: DiscoveredEpisode,
  cacheDirectory: string,
  ffmpegPath: string,
): Promise<string> {
  await mkdir(cacheDirectory, { recursive: true });
  const sourceStats = await stat(episode.absolutePath);
  const cacheKey = createHash("sha256")
    .update(
      `${episode.absolutePath}:${sourceStats.size}:${sourceStats.mtimeMs}`,
    )
    .digest("hex")
    .slice(0, 24);
  const outputPath = path.join(cacheDirectory, `${cacheKey}.mp4`);

  try {
    await stat(outputPath);
    return outputPath;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const temporaryPath = `${outputPath}.${randomUUID()}.tmp.mp4`;

  await runProcess(ffmpegPath, [
    "-hide_banner",
    "-y",
    "-i",
    episode.absolutePath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-vf",
    "setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-af",
    "asetpts=PTS-STARTPTS",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "24",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-map_metadata",
    "-1",
    temporaryPath,
  ]);

  await import("node:fs/promises").then(({ rename }) =>
    rename(temporaryPath, outputPath),
  );
  return outputPath;
}

export async function extractFrame(
  sourcePath: string,
  timestampMs: number,
  outputPath: string,
  ffmpegPath: string,
): Promise<void> {
  const timestampSeconds = (timestampMs / 1000).toFixed(3);

  await runProcess(ffmpegPath, [
    "-hide_banner",
    "-y",
    // Input seeking is relative to the source start time and accurate seeking remains enabled.
    "-ss",
    timestampSeconds,
    "-i",
    sourcePath,
    "-map",
    "0:v:0",
    "-frames:v",
    "1",
    "-vf",
    "scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-c:v",
    "libwebp",
    "-quality",
    "84",
    "-compression_level",
    "5",
    "-map_metadata",
    "-1",
    outputPath,
  ]);
}
