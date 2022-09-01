import { parse, transform, renderers } from '@markdoc/markdoc';
import { json, type LoaderArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import * as react from 'react';

async function getMarkdown(context: unknown, page: string | undefined) {
	const response = page
		? await (context as { ASSETS: { fetch: typeof fetch } }).ASSETS.fetch(
				`http://conform.guide/docs/${page}.md`,
		  )
		: new Response('Not found', { status: 404 });

	if (response.status === 404) {
		throw response;
	}

	return response.text();
}

export async function loader({ params, context }: LoaderArgs) {
	const markdown = await getMarkdown(context, params.page);
	const ast = parse(markdown);
	const content = transform(ast);

	return json({
		content,
	});
}

export default function Page() {
	let { content } = useLoaderData<typeof loader>();

	return (
		<article className="prose prose-zinc prose-invert">
			{renderers.react(content, react)}
		</article>
	);
}
