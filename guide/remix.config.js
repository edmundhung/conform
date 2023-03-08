/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	serverModuleFormat: 'esm',
	serverDependenciesToBundle: ['@remix-run/react'],
	future: {
		v2_routeConvention: true,
		unstable_dev: {
			appServerPort: 3000,
			rebuildPollIntervalMs: 500,
		},
		unstable_postcss: true,
		unstable_tailwind: true,
	},
};
