import {getUserOptions} from './options-storage';

function processNode(
	node: HTMLElement,
	channelNamesSet: Set<string>,
	duration: string,
) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	let channelName: HTMLElement | null | undefined;
	if (
		window.location.href.includes('youtube.com/c/') ||
		window.location.href.includes('youtube.com/@')
	) {
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

	const hiddenDuration = ' ' + duration + ' ';
	if (
		channelName?.textContent &&
		channelNamesSet.has(channelName.textContent)
	) {
		// Check if it belongs to a channel to remove
		node.textContent = hiddenDuration;
	} else if (node.textContent === hiddenDuration) {
		// Unhide the time if it's not on our channel list
		const times = node.getAttribute('aria-label')?.match(/\d+/g);
		if (times) {
			// Parse the time obtained from the 'aria-label' from text to numbers
			// e.g., "3 minutes, 42 seconds" => "3:42"
			const paddedTimes = times
				.slice(0, 1)
				.concat(times.slice(1).map((t) => t.padStart(2, '0')));
			const displayTime =
				times.length > 1
					? ` ${paddedTimes.join(':')} `
					: ` 0:${times[0].padStart(2, '0')} `;
			node.textContent = displayTime;
		}
	}
}

export async function replaceFutureThumbnailTimes(): Promise<void> {
	const options = await getUserOptions();
	const channelNames = options.channels;
	const channelNamesSet = new Set<string>();
	for (const name of channelNames.split('\n')) channelNamesSet.add(name);

	const duration = options.duration;
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				// For each new node added, check if it's a video thumbnail time
				// and remove it if so
				for (const node of mutation.addedNodes) {
					if (
						node instanceof HTMLElement &&
						node.classList.contains(
							'ytd-thumbnail-overlay-time-status-renderer',
						) &&
						node.getAttribute('id') === 'text'
					) {
						processNode(node, channelNamesSet, duration);
					}
				}
			} else if (
				// Thumbnail time was changed for an existing thumbnail
				mutation.type === 'attributes' &&
				mutation.attributeName === 'aria-label' &&
				(mutation.target as HTMLElement).getAttribute('id') === 'text'
			) {
				processNode(mutation.target as HTMLElement, channelNamesSet, duration);
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
	});
}

export async function replaceCurrentThumbnailTimes(): Promise<void> {
	const options = await getUserOptions();
	const channelNames = options.channels;
	const channelNamesSet = new Set<string>();
	for (const name of channelNames.split('\n')) channelNamesSet.add(name);

	const duration = options.duration;
	for (const node of document.querySelectorAll(
		'span.ytd-thumbnail-overlay-time-status-renderer',
	)) {
		processNode(node as HTMLElement, channelNamesSet, duration);
	}
}

void replaceFutureThumbnailTimes();
if (document.body) void replaceCurrentThumbnailTimes();
else
	document.addEventListener('DOMContentLoaded', replaceCurrentThumbnailTimes);
