import { createRequestHandler, RouterContextProvider } from 'react-router';
import { cloudflareContext, getLanguageCode } from '~/util';

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
);

export default {
	fetch(request, env, ctx) {
		const context = new RouterContextProvider();

		context.set(cloudflareContext, {
			env,
			ctx,
			language: getLanguageCode(request.url),
		});

		return requestHandler(request, context);
	},
} satisfies ExportedHandler<Env>;
