import { createRequestHandler } from '@remix-run/cloudflare';
import * as build from '../build';

let handleRequest: ReturnType<typeof createRequestHandler>;

export const onRequest: PagesFunction<Env> = (context) => {
	if (!handleRequest) {
		handleRequest = createRequestHandler(
			// @ts-expect-error
			build,
			context.env.ENVIRONMENT,
		);
	}

	// This is where you can pass a custom load context to your app
	return handleRequest(context.request, {
		env: {
			...context.env,
			CF_PAGES_BRANCH: 'guide-v2',
		},
		waitUntil(promise: Promise<unknown>) {
			context.waitUntil(promise);
		},
	});
};
