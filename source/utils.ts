export async function waitForElement(selector: string): Promise<HTMLElement> {
	return new Promise((resolve) => {
		const element = document.querySelector(selector);
		if (element) {
			resolve(element as HTMLElement);
			return;
		}

		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) {
				resolve(element as HTMLElement);
				observer.disconnect();
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});
}
