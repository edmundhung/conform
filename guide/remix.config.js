const { flatRoutes } = require('remix-flat-routes');

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	serverModuleFormat: 'esm',
	serverDependenciesToBundle: ['@remix-run/react'],
	ignoredRouteFiles: ['**/*'],
	future: {
		unstable_dev: {
			appServerPort: 3000,
			rebuildPollIntervalMs: 500,
		},
		unstable_tailwind: true,
	},
	routes: async (defineRoutes) => {
		return flatRoutes('routes', defineRoutes);
	},
};
