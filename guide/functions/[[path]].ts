import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';
import * as build from '../build';

let handleRequest: ReturnType<typeof createPagesFunctionHandler>;

export const onRequest: PagesFunction<Env> = (context) => {
	if (!handleRequest) {
		handleRequest = createPagesFunctionHandler({
			// @ts-expect-error
			build,
			// eslint-disable-next-line no-undef
			mode: context.env.ENVIRONMENT,
			getLoadContext: (context) => {
				const env = {
					...context.env,
					CF_PAGES_BRANCH: 'main',
				};

				return {
					env,
					waitUntil(promise: Promise<unknown>) {
						context.waitUntil(promise);
					},
				};
			},
		});
	}

	return handleRequest(context);
};
