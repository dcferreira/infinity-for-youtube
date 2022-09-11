import {getUserOptions} from './options-storage';
import {waitForElement} from './utils';

async function getChannels(): Promise<Set<string>> {
	const options = await getUserOptions();
	const channelNames: string = options.channels;
	const channelUrls = new Set<string>();
	for (const name of channelNames.split(',')) channelUrls.add('/c/' + name);
	return channelUrls;
}

async function checkCurrentVideo(
	channels: Promise<Set<string>>,
): Promise<boolean> {
	const currChannel = document.querySelector('#meta-contents #channel-name a');
	if (currChannel?.hasAttribute('href')) {
		const monitoredChannels = await channels;
		return monitoredChannels.has(currChannel.getAttribute('href')!);
	}

	return false;
}

async function removeProgressBar() {
	const progressBar = document.querySelector('.ytp-progress-bar-container');
	const channels = getChannels();
	const removeNeeded = await checkCurrentVideo(channels);
	if (removeNeeded && progressBar) {
		progressBar.remove();
	}
}

async function removeTotalTime(duration: string) {
	// Wait to get the channel information
	const currChannel = await waitForElement('#meta-contents #channel-name a');

	// Fetch the time and set up a function to change it
	const time = document.querySelector('.ytp-time-duration')!;
	async function setTime(node: HTMLElement) {
		const channels = getChannels();
		const removeNeeded = await checkCurrentVideo(channels);
		if (removeNeeded && node.textContent !== duration) {
			// Change text, but store the old value in the element
			if (time.textContent) time.setAttribute('old-time', time.textContent);
			else time.setAttribute('old-time', '0');
			time.textContent = duration;
		} else if (
			!removeNeeded &&
			node.textContent === duration &&
			time.hasAttribute('old-time')
		) {
			// If the channel changes after the video time was reset,
			// we can restore the time
			time.textContent = time.getAttribute('old-time')!;
		}
	}

	if (time) {
		const emptyElement = document.createElement('div');
		void setTime(emptyElement);

		// Monitor changes to the time
		const timeObserver = new MutationObserver((mutations) => {
			// Monitor the total video time for changes (ad starts, or a new video without page refresh)
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					for (const node of mutation.addedNodes) {
						void setTime(node as HTMLElement);
					}
				}
			}
		});

		timeObserver.observe(time, {
			childList: true,
		});

		// Monitor changes to the channel
		const channelObserver = new MutationObserver((mutations) => {
			// Monitor the channel name, it's slower to refresh than the video time
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					for (const node of mutation.addedNodes) {
						void setTime(time as HTMLElement);
					}
				}
			}
		});

		channelObserver.observe(currChannel, {
			childList: true,
			subtree: true,
		});
	}
}

void removeProgressBar();
void removeTotalTime('∞');
