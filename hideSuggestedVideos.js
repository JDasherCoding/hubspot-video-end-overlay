// === Script Initialization Log ===
// console.log("JavaScript Loaded: hideSuggestedVideos.js");

// === Constants ===
const YT_API_SRC = "https://www.youtube.com/iframe_api";
const MAX_RETRIES = 50;

const CSS = {
	WRAPPER_CLASS: "video-overlay-wrapper",
	PLAYER_CONTAINER_ID: "player-container",
	OVERLAY_ID: "overlay",
	HIDDEN_CLASS: "hidden",
	VISIBLE_CLASS: "visible",
	OVERLAY_CLASS: "video-overlay",
	REPLAY_BUTTON_ID: "replay-btn",
	OVERLAY_THUMBNAIL_CLASS: "overlay-thumbnail",
	OVERLAY_CONTENT_CLASS: "overlay-content",
	REPLAY_BUTTON_CLASS: "replay-button",
	REPLAY_ICON_CLASS: "replay-icon",
};

let player; // YouTube player instance

// === DOM Helpers ===

// Get the embedded YouTube iframe
function getYouTubeIframe() {
	const iframe = document.querySelector("iframe[src*='youtube.com/embed']");
	if (!iframe) throw new Error("No YouTube iframe found");
	return iframe;
}

// Extract the video ID from the iframe src
function extractVideoId(iframe) {
	const match = iframe.src.match(/embed\/([^?&]+)/);
	if (!match || !match[1]) {
		throw new Error("Unable to extract YouTube video ID");
	}
	return match[1];
}

// Build the YouTube thumbnail URL based on screen size
function getThumbnailURL(videoId) {
	const quality = window.innerWidth < 500 ? "hqdefault" : "maxresdefault";
	return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// Create a div to hold the YouTube player
function createPlayerContainer(wrapper) {
	const playerDiv = document.createElement("div");
	playerDiv.id = CSS.PLAYER_CONTAINER_ID;
	playerDiv.className = "oembed_container_iframe";
	wrapper.appendChild(playerDiv);
	return playerDiv;
}

// Create the overlay UI with replay button
function createOverlay(thumbURL) {
	const overlay = document.createElement("div");
	overlay.id = CSS.OVERLAY_ID;
	overlay.className = `${CSS.OVERLAY_CLASS} ${CSS.HIDDEN_CLASS}`;
	overlay.innerHTML = `
    <img src="${thumbURL}" class="${CSS.OVERLAY_THUMBNAIL_CLASS}" alt="Video thumbnail">
    <div class="${CSS.OVERLAY_CONTENT_CLASS}">
      <button id="${CSS.REPLAY_BUTTON_ID}" class="${CSS.REPLAY_BUTTON_CLASS}" aria-label="Replay video">
        <div class="${CSS.REPLAY_ICON_CLASS}"></div>
      </button>
    </div>
  `;
	return overlay;
}

// === Overlay UI ===

// Show overlay and hide player
function showOverlay(playerDiv, overlayDiv) {
	playerDiv.classList.add(CSS.HIDDEN_CLASS);
	overlayDiv.classList.remove(CSS.HIDDEN_CLASS);
	overlayDiv.classList.add(CSS.VISIBLE_CLASS);

	const replayBtn = overlayDiv.querySelector(`#${CSS.REPLAY_BUTTON_ID}`);
	if (replayBtn) replayBtn.focus();
}

// Hide overlay and show player
function hideOverlay(playerDiv, overlayDiv) {
	overlayDiv.classList.remove(CSS.VISIBLE_CLASS);
	overlayDiv.classList.add(CSS.HIDDEN_CLASS);
	playerDiv.classList.remove(CSS.HIDDEN_CLASS);
}

// === YouTube API Loader ===

// Load the YouTube API and wait for it to be ready
function loadYouTubeAPI() {
	if (!window.YT || !window.YT.Player) {
		const script = document.createElement("script");
		script.src = YT_API_SRC;
		document.head.appendChild(script);
	}

	return new Promise((resolve, reject) => {
		let retries = 0;

		function checkAPI() {
			if (window.YT?.Player) {
				resolve();
			} else if (++retries > MAX_RETRIES) {
				reject("YouTube API failed to load.");
			} else {
				setTimeout(checkAPI, 100);
			}
		}

		checkAPI();
	});
}

// === YouTube Player Setup ===

// Initialize the YouTube player instance
function initYouTubePlayer(videoId, playerDiv, overlayDiv) {
	player = new YT.Player(playerDiv.id, {
		videoId,
		playerVars: {
			rel: 0,
			modestbranding: 1,
			controls: 1,
			autoplay: 0,
		},
		events: {
			//  onReady: () => console.log("YouTube Player is ready."),
			onStateChange: (e) => {
				if (e.data === YT.PlayerState.ENDED) {
					showOverlay(playerDiv, overlayDiv);
				}
			},
		},
	});
}

// Add logic to replay the video on replay button click
function setupReplay(overlayDiv, playerDiv, videoId) {
	const replayBtn = overlayDiv.querySelector(`#${CSS.REPLAY_BUTTON_ID}`);
	if (!replayBtn) return;

	replayBtn.addEventListener("click", () => {
		hideOverlay(playerDiv, overlayDiv);

		if (player?.loadVideoById) {
			player.loadVideoById(videoId);
		} else {
			console.warn("Fallback: YouTube player not available.");
		}
	});
}

// === Main Initialization Function ===

(function init() {
	try {
		const iframe = getYouTubeIframe();
		const videoId = extractVideoId(iframe);
		const thumbURL = getThumbnailURL(videoId);

		const hubspotWrapper = document.querySelector(".iframe_wrapper");
		if (!hubspotWrapper) throw new Error("HubSpot iframe wrapper not found");

		// Wrap the existing iframe in a new container
		const wrapper = document.createElement("div");
		wrapper.className = CSS.WRAPPER_CLASS;
		wrapper.dataset.videoOverlay = "true";
		hubspotWrapper.parentNode.insertBefore(wrapper, hubspotWrapper);
		wrapper.appendChild(hubspotWrapper);

		// Create player container and overlay elements
		const playerDiv = createPlayerContainer(wrapper);
		const overlayDiv = createOverlay(thumbURL);
		wrapper.appendChild(overlayDiv);

		// Hide the original HubSpot iframe
		iframe.style.display = "none";

		// Add replay click listener
		setupReplay(overlayDiv, playerDiv, videoId);

		// Load YouTube API and then initialize the player
		loadYouTubeAPI()
			.then(() => initYouTubePlayer(videoId, playerDiv, overlayDiv))
			.catch((err) => console.error(err));
	} catch (error) {
		console.error("Error in hideSuggestedVideos.js:", error);
	}
})();
