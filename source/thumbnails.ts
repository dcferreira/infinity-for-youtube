import {getUserOptions} from './options-storage';

function processNode(
	node: HTMLElement,
	channelNamesSet: Set<string>,
	duration: string,
) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	let channelName: HTMLElement | null | undefined;
	if (window.location.href.includes('youtube.com/c/')) {
		// We're in a channel page
		channelName = document
			.querySelector('.ytd-channel-name')
			?.querySelector('yt-formatted-string');
	} else {
		channelName = node
			.closest('ytd-thumbnail')
			?.parentElement?.querySelector('.ytd-channel-name')
			?.querySelector('yt-formatted-string');
	}

	if (
		channelName?.textContent &&
		channelNamesSet.has(channelName.textContent)
	) {
		// Check if it belongs to a channel to remove
		node.textContent = duration;
	}
}

export async function replaceFutureThumbnailTimes(): Promise<void> {
	const options = await getUserOptions();
	const channelNames = options.channels;
	const channelNamesSet = new Set<string>();
	for (const name of channelNames.split('\n')) channelNamesSet.add(name);

	const duration = options.duration;
	const observer = new MutationObserver((mutations) => {
		// For each new node added, check if it's a video thumbnail time
		// and remove it if so
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (
					node instanceof HTMLElement &&
					node.classList.contains('ytd-thumbnail-overlay-time-status-renderer')
				) {
					processNode(node, channelNamesSet, duration);
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

export async function replaceCurrentThumbnailTimes(): Promise<void> {
	const options = await getUserOptions();
	const channelNames = options.channels;
	const channelNamesSet = new Set<string>();
	for (const name of channelNames.split('\n')) channelNamesSet.add(name);

	const duration = options.duration;
	for (const node of document.querySelectorAll(
		'.ytd-thumbnail-overlay-time-status-renderer',
	))
		processNode(node as HTMLElement, channelNamesSet, duration);
}

void replaceCurrentThumbnailTimes();
void replaceFutureThumbnailTimes();
