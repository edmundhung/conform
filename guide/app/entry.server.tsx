import type { EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';
import { renderToReadableStream } from 'react-dom/server';

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
) {
	const body = await renderToReadableStream(
		<ServerRouter context={routerContext} url={request.url} />,
		{ signal: request.signal },
	);

	// Wait for the hydration data to be streamed in so the response is complete
	await body.allReady;

	responseHeaders.set('Content-Type', 'text/html');

	return new Response(body, {
		status: responseStatusCode,
		headers: responseHeaders,
	});
}
