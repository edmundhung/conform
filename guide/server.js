import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import * as build from '@remix-run/dev/server-build';

const handleRequest = createPagesFunctionHandler({
	build,
	// eslint-disable-next-line no-undef
	mode: process.env.NODE_ENV,
	getLoadContext: (context) => {
		const env = {
			...context.env,
			CF_PAGES_BRANCH: 'main',
		};

		return {
			env,
			waitUntil(promise) {
				context.waitUntil(promise);
			},
		};
	},
});

export function onRequest(context) {
	return handleRequest(context);
}
