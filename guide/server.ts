import { logDevReady } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import * as build from '@remix-run/dev/server-build';

if (process.env.NODE_ENV === 'development') {
	logDevReady(build);
}

export const onRequest = createPagesFunctionHandler({
	build,
	getLoadContext: (context) => ({
		env: {
			...context.env,
			CF_PAGES_BRANCH: 'main',
		},
		waitUntil(promise: Promise<unknown>) {
			context.waitUntil(promise);
		},
	}),
	mode: process.env.NODE_ENV,
});
