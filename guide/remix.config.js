const { flatRoutes } = require('remix-flat-routes');

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	serverBuildTarget: 'cloudflare-pages',
	server: './server.js',
	devServerBroadcastDelay: 1000,
	// ignore all files in routes folder
	ignoredRouteFiles: ['**/*'],
	routes: async (defineRoutes) => {
		return flatRoutes('routes', defineRoutes);
	},
	// appDirectory: "app",
	// assetsBuildDirectory: "public/build",
	// serverBuildPath: "functions/[[path]].js",
	// publicPath: "/build/",
};
