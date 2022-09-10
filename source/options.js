// eslint-disable-next-line import/no-unassigned-import
import "webext-base-css";
import "./options.css";

import optionsStorage from "./options-storage.ts";

function updateInputField(event) {
	numberInputs[rangeInputs.indexOf(event.currentTarget)].value =
		event.currentTarget.value;
}

for (const input of rangeInputs) {
	input.addEventListener("input", updateInputField);
}

async function init() {
	await optionsStorage.syncForm("#options-form");
}

init();
