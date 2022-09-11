// eslint-disable-next-line import/no-unassigned-import
import 'webext-base-css';
import './options.css';

import optionsStorage from './options-storage';

async function init() {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	await optionsStorage.syncForm('#options-form');
}

void init();
