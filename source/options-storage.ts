import OptionsSync from "webext-options-sync";

export default new OptionsSync({
	defaults: {
		channels: "FeerRL,JohnnyBoi91",
	},
	migrations: [OptionsSync.migrations.removeUnused],
	logging: true,
});
