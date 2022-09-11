import {getUserOptions} from './options-storage';

async function replaceThumbnailTimes() {
	const options = await getUserOptions();
	const channelNames = options.channels;
	const channelUrlsSet = new Set();
	for (const name of channelNames.split(',')) channelUrlsSet.add('/c/' + name);

	const duration = '∞';
	const observer = new MutationObserver((mutations) => {
		// For each new node added, check if it's a video thumbnail time
		// and remove it if so
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (
					node instanceof HTMLElement &&
					node.classList.contains('ytd-thumbnail-overlay-time-status-renderer')
				) {
					const channelUrl = node
						.closest('.ytd-rich-item-renderer')
						?.querySelector('.ytd-channel-name')
						?.querySelector('.yt-simple-endpoint');
					if (
						channelUrl &&
						channelUrlsSet.has(channelUrl.getAttribute('href'))
					) {
						// Check if it belongs to a channel to remove
						node.textContent = duration;
					}
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

void replaceThumbnailTimes();
