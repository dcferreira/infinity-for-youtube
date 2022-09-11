import OptionsSync from 'webext-options-sync';

export type UserConfig = {
	channels: string;
};

const defaults: UserConfig = {
	channels: 'FeerRL,JohnnyBoi91',
};

function buildOptions(): OptionsSync<UserConfig> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
	return new OptionsSync({
		defaults,
		migrations: [OptionsSync.migrations.removeUnused],
		logging: true,
	})!;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const optionsStorage: OptionsSync<UserConfig> = buildOptions();

export async function getUserOptions(): Promise<UserConfig> {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
	return optionsStorage.getAll();
}

export default optionsStorage;
