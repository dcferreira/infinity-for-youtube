export function waitForElem(selector: string): Promise<HTMLElement> {
	return new Promise((resolve) => {
		const elem = document.querySelector(selector);
		if (elem) {
			return resolve(elem as HTMLElement);
		}

		const observer = new MutationObserver(() => {
			const elem = document.querySelector(selector);
			if (elem) {
				resolve(elem as HTMLElement);
				observer.disconnect();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});
}
