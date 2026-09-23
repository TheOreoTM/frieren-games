const elements = {
  select: document.querySelector("#episode-select"),
  video: document.querySelector("#video"),
  placeholder: document.querySelector("#video-placeholder"),
  loading: document.querySelector("#loading"),
  currentTime: document.querySelector("#current-time"),
  duration: document.querySelector("#duration"),
  scrubber: document.querySelector("#scrubber"),
  playPause: document.querySelector("#play-pause"),
  seekBack: document.querySelector("#seek-back"),
  seekForward: document.querySelector("#seek-forward"),
  previous: document.querySelector("#previous"),
  next: document.querySelector("#next"),
  approve: document.querySelector("#approve"),
  status: document.querySelector("#status"),
  approvedTotal: document.querySelector("#approved-total"),
  sourceName: document.querySelector("#source-name"),
  pictureInfo: document.querySelector("#picture-info"),
  previewInfo: document.querySelector("#preview-info"),
  episodeApproved: document.querySelector("#episode-approved"),
};

const state = { episodes: [], selectedIndex: -1, loading: false, approving: false };

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00.000";
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const minutes = Math.floor(milliseconds / 60_000);
  const remainingSeconds = Math.floor((milliseconds % 60_000) / 1000);
  const remainder = milliseconds % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}.${String(remainder).padStart(3, "0")}`;
}

function setStatus(message, error = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", error);
}

function selectedEpisode() {
  return state.episodes[state.selectedIndex];
}

function updateControls() {
  const episode = selectedEpisode();
  const usable = Boolean(episode?.season && !state.loading && !state.approving);
  elements.approve.disabled = !usable;
  elements.select.disabled = state.loading || state.approving || state.episodes.length === 0;
  elements.previous.disabled = state.selectedIndex <= 0 || state.loading;
  elements.next.disabled = state.selectedIndex < 0 || state.selectedIndex >= state.episodes.length - 1 || state.loading;
  elements.playPause.disabled = !episode || state.loading;
  elements.seekBack.disabled = !episode || state.loading;
  elements.seekForward.disabled = !episode || state.loading;
}

async function request(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `Request failed (${response.status}).`);
  return value;
}

async function selectEpisode(index) {
  if (index < 0 || index >= state.episodes.length) return;
  state.selectedIndex = index;
  elements.select.value = String(index);
  const episode = selectedEpisode();
  elements.sourceName.textContent = episode.relativePath;
  elements.pictureInfo.textContent = `${episode.width}×${episode.height} · ${episode.videoCodec}`;
  elements.previewInfo.textContent = episode.playback === "source" ? "Direct local source" : "Cached H.264 proxy";
  elements.episodeApproved.textContent = String(episode.approvedCount);
  elements.duration.textContent = `/ ${formatTime(episode.durationMs / 1000)}`;
  elements.scrubber.max = String(episode.durationMs / 1000);
  elements.scrubber.value = "0";
  elements.currentTime.textContent = formatTime(0);
  elements.video.removeAttribute("src");
  elements.video.load();
  elements.placeholder.hidden = true;
  elements.loading.hidden = false;
  state.loading = true;
  updateControls();
  setStatus(episode.playback === "proxy" ? "Generating or opening the cached local proxy…" : "Opening the local source…");

  try {
    const result = await request(`/api/episodes/${episode.id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    elements.video.src = result.mediaUrl;
    elements.video.load();
    setStatus(episode.season ? `Ready: Season ${episode.season}, Episode ${episode.episode}.` : "This filename is unmapped and cannot be approved.");
  } catch (error) {
    elements.placeholder.hidden = false;
    elements.placeholder.textContent = "The local preview could not be prepared.";
    setStatus(error.message, true);
  } finally {
    state.loading = false;
    elements.loading.hidden = true;
    updateControls();
  }
}

function seek(deltaSeconds) {
  const nextTime = Math.min(elements.video.duration || 0, Math.max(0, elements.video.currentTime + deltaSeconds));
  elements.video.currentTime = nextTime;
}

function chooseDifficulty(value) {
  document.querySelector(`input[name="difficulty"][value="${value}"]`).checked = true;
}

async function approveFrame() {
  const episode = selectedEpisode();
  if (!episode?.season || state.approving || state.loading) return;
  state.approving = true;
  updateControls();
  const timestampMs = Math.round(elements.video.currentTime * 1000);
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  setStatus(`Extracting ${formatTime(timestampMs / 1000)} from the original source…`);

  try {
    const result = await request("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId: episode.id, timestampMs, difficulty }),
    });
    episode.approvedCount += 1;
    elements.episodeApproved.textContent = String(episode.approvedCount);
    elements.approvedTotal.textContent = String(result.approvedTotal);
    setStatus(`Approved ${result.frame.localId}.webp at ${formatTime(timestampMs / 1000)}.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    state.approving = false;
    updateControls();
  }
}

elements.select.addEventListener("change", () => selectEpisode(Number(elements.select.value)));
elements.previous.addEventListener("click", () => selectEpisode(state.selectedIndex - 1));
elements.next.addEventListener("click", () => selectEpisode(state.selectedIndex + 1));
elements.playPause.addEventListener("click", () => {
  if (elements.video.paused) elements.video.play();
  else elements.video.pause();
});
elements.seekBack.addEventListener("click", () => seek(-5));
elements.seekForward.addEventListener("click", () => seek(5));
elements.approve.addEventListener("click", approveFrame);
elements.scrubber.addEventListener("input", () => { elements.video.currentTime = Number(elements.scrubber.value); });
elements.video.addEventListener("timeupdate", () => {
  elements.currentTime.textContent = formatTime(elements.video.currentTime);
  if (!elements.scrubber.matches(":active")) elements.scrubber.value = String(elements.video.currentTime);
});
elements.video.addEventListener("play", () => { elements.playPause.firstChild.textContent = "Pause "; });
elements.video.addEventListener("pause", () => { elements.playPause.firstChild.textContent = "Play "; });

document.addEventListener("keydown", (event) => {
  if (["SELECT", "INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  const key = event.key.toLowerCase();
  if ([" ", "arrowleft", "arrowright"].includes(key)) event.preventDefault();
  if (key === " ") {
    if (elements.video.paused) elements.video.play();
    else elements.video.pause();
  }
  else if (key === "arrowleft") seek(event.shiftKey ? -1 : -5);
  else if (key === "arrowright") seek(event.shiftKey ? 1 : 5);
  else if (key === "1") chooseDifficulty("EASY");
  else if (key === "2") chooseDifficulty("MEDIUM");
  else if (key === "3") chooseDifficulty("HARD");
  else if (key === "a") approveFrame();
  else if (key === "n") selectEpisode(state.selectedIndex + 1);
  else if (key === "p") selectEpisode(state.selectedIndex - 1);
});

async function initialize() {
  try {
    const result = await request("/api/episodes");
    state.episodes = result.episodes;
    elements.approvedTotal.textContent = String(result.approvedTotal);
    elements.select.replaceChildren(...state.episodes.map((episode, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = episode.season
        ? `S${String(episode.season).padStart(2, "0")}E${String(episode.episode).padStart(2, "0")} · ${episode.filename}`
        : `Unmapped · ${episode.filename}`;
      return option;
    }));

    if (state.episodes.length === 0) {
      elements.select.replaceChildren(new Option("No video files found", ""));
      setStatus("No supported video files were found under CURATOR_MEDIA_ROOT.", true);
      updateControls();
      return;
    }

    await selectEpisode(0);
  } catch (error) {
    setStatus(error.message, true);
  }
}

initialize();
