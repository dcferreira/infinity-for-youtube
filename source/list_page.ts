import optionsStorage from "./options-storage";

async function replaceThumbnailTimes() {
	const options = await optionsStorage.getAll();
	const channelNames = options.channels;
	const channelUrls = new Set();
	channelNames.split(",").forEach((name) => channelUrls.add("/c/" + name));

	const duration = "∞";
	const observer = new MutationObserver((mutations) => {
		// for each new node added, check if it's a video thumbnail time
		// and remove it if so
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node instanceof HTMLElement) {
					let classes = node.classList;
					if (classes.contains("ytd-thumbnail-overlay-time-status-renderer")) {
						let thumbnail = node.closest(".ytd-rich-item-renderer");
						if (thumbnail) {
							let channelName = thumbnail.querySelector(".ytd-channel-name");
							if (channelName) {
								let channelUrl = channelName.querySelector(
									".yt-simple-endpoint"
								);
								if (channelUrl) {
									if (channelUrls.has(channelUrl.getAttribute("href"))) {
										// check if it belongs to a channel to remove
										node.innerText = duration;
									}
								}
							}
						}
					}
				}
			});
		});
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

replaceThumbnailTimes();
