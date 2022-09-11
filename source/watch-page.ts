import {getUserOptions} from './options-storage';
import {waitForElement} from './utils';

async function getChannels(): Promise<Set<string>> {
	const options = await getUserOptions();
	const channels: string = options.channels;
	const channelNames = new Set<string>();
	for (const name of channels.split(',')) channelNames.add(name);
	return channelNames;
}

async function checkCurrentVideo(
	channels: Promise<Set<string>>,
): Promise<boolean> {
	const currChannel = document.querySelector('#meta-contents #channel-name a');
	if (currChannel?.textContent) {
		const monitoredChannels = await channels;
		return monitoredChannels.has(currChannel.textContent);
	}

	return false;
}

class FutureElement {
	// eslint-disable-next-line @typescript-eslint/ban-types
	element: HTMLElement | null;
	query: string;
	baseElement: HTMLElement;

	constructor(selector: string, base: HTMLElement = document.body) {
		this.query = selector;
		this.element = null;
		this.baseElement = base;
	}

	exists(): boolean {
		if (!this.element) {
			this.element = this.baseElement.querySelector(this.query);
		}

		return this.element !== null;
	}

	async show() {
		if (this.exists()) {
			this.element!.style.setProperty('opacity', '1');
		}
	}

	async hide() {
		if (this.exists()) {
			this.element!.style.setProperty('opacity', '0');
		}
	}

	async monitorNode(callback: () => Promise<void>) {
		// Wait for element to appear, and call the callback function when it comes
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'childList' && this.exists()) {
					void callback();
					observer.disconnect();
				}
			}
		});

		observer.observe(this.baseElement, {
			childList: true,
			subtree: true,
		});
	}
}

async function monitorPlayer() {
	const options = await getUserOptions();
	const duration: string = options.duration;

	// Wait to get the channel information
	const currChannel = await waitForElement('#meta-contents #channel-name a');

	// Fetch the time and set up a function to change it
	const player: HTMLElement = document.querySelector('#movie_player')!;
	const time = new FutureElement('.ytp-time-duration', player);
	const progressBar = new FutureElement('.ytp-progress-bar-container', player);
	const tooltip = new FutureElement('div.ytp-tooltip.ytp-bottom', player);
	async function updatePlayerElements() {
		const channels = getChannels();
		const removeNeeded = await checkCurrentVideo(channels);

		const timeElement = time.element!;
		if (removeNeeded && timeElement.textContent !== duration) {
			// Change text, but store the old value in the element
			if (timeElement.textContent)
				timeElement.setAttribute('old-time', timeElement.textContent);
			else timeElement.setAttribute('old-time', '0');
			timeElement.textContent = duration;

			void progressBar.hide();
			void tooltip.hide();
		} else if (
			!removeNeeded &&
			timeElement.textContent === duration &&
			timeElement.hasAttribute('old-time')
		) {
			// If the channel changes after the video time was reset,
			// we can restore the elements
			timeElement.textContent = timeElement.getAttribute('old-time')!;

			void progressBar.show();
			void tooltip.show();
		}
	}

	void tooltip.monitorNode(updatePlayerElements);

	if (time.exists()) {
		void updatePlayerElements();

		// Monitor changes to the time
		const timeObserver = new MutationObserver((mutations) => {
			// Monitor the total video time for changes (ad starts, or a new video without page refresh)
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					for (const _node of mutation.addedNodes) {
						void updatePlayerElements();
					}
				}
			}
		});

		timeObserver.observe(time.element!, {
			childList: true,
		});

		// Monitor changes to the channel
		const channelObserver = new MutationObserver((mutations) => {
			// Monitor the channel name, it's slower to refresh than the video time
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					for (const _node of mutation.addedNodes) {
						void updatePlayerElements();
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

void monitorPlayer();
