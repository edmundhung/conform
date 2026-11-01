import { createRequestHandler, RouterContextProvider } from 'react-router';
import { cloudflareContext, getLanguageCode } from '~/util';

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env) {
		const context = new RouterContextProvider();

		context.set(cloudflareContext, {
			env,
			language: getLanguageCode(request.url),
		});

		const response = await requestHandler(request, context);

		// The Worker cache ignores the hostname, which decides the language
		response.headers.append('Vary', 'Host');

		// Only cache the responses that opt in, e.g. not errors or redirects
		if (!response.headers.has('Cache-Control')) {
			response.headers.set('Cache-Control', 'no-store');
		}

		return response;
	},
} satisfies ExportedHandler<Env>;
