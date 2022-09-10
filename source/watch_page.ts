import optionsStorage from "./options-storage";
import { waitForElem } from "./utils";

async function getChannels(): Promise<Set<string>> {
	const options = await optionsStorage.getAll();
	const channelNames = options.channels;
	const channelUrls: Set<string> = new Set();
	channelNames.split(",").forEach((name) => channelUrls.add("/c/" + name));
	return channelUrls;
}

async function checkCurrentVideo(
	channels: Promise<Set<string>>
): Promise<boolean> {
	const currChannel = document.querySelector("#meta-contents #channel-name a");
	if (currChannel?.hasAttribute("href")) {
		return (await channels).has(currChannel.getAttribute("href") as string);
	}
	return false;
}

async function removeProgressBar() {
	let progressBar = document.querySelector(".ytp-progress-bar-container");
	const channels = getChannels();
	const removeNeeded = await checkCurrentVideo(channels);
	if (removeNeeded && progressBar) {
		progressBar.remove();
	}
}

async function removeTotalTime(duration: string) {
	// wait to get the channel information
	const currChannel = await waitForElem("#meta-contents #channel-name a");

	// fetch the time and set up a function to change it
	const time = document.querySelector(".ytp-time-duration") as HTMLElement;
	async function setTime(node: HTMLElement) {
		const channels = getChannels();
		const removeNeeded = await checkCurrentVideo(channels);
		if (removeNeeded && node.textContent != duration) {
			// change text, but store the old value in the element
			time.setAttribute("old_time", time.innerText);
			time.innerText = duration;
		} else if (
			!removeNeeded &&
			node.textContent == duration &&
			time.hasAttribute("old_time")
		) {
			// if the channel changes after the video time was reset,
			// we can restore the time
			time.innerText = time.getAttribute("old_time") as string;
		}
	}
	if (time) {
		const emptyElement = document.createElement("div");
		setTime(emptyElement);

		// monitor changes to the time
		const timeObserver = new MutationObserver((mutations) => {
			// Monitor the total video time for changes (ad starts, or a new video without page refresh)
			mutations.forEach((mutation) => {
				if (mutation.type == "childList") {
					mutation.addedNodes.forEach((node) => {
						setTime(node as HTMLElement);
					});
				}
			});
		});

		timeObserver.observe(time, {
			childList: true,
		});

		// monitor changes to the channel
		const channelObserver = new MutationObserver((mutations) => {
			// Monitor the channel name, it's slower to refresh than the video time
			mutations.forEach((mutation) => {
				if (mutation.type == "childList") {
					mutation.addedNodes.forEach(() => {
						setTime(time);
					});
				}
			});
		});

		channelObserver.observe(currChannel, {
			childList: true,
			subtree: true,
		});
	}
}

removeProgressBar();
removeTotalTime("∞");
