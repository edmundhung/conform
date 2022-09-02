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
		<div className="flex relative">
			<section className="flex-1 prose prose-zinc dark:prose-invert py-8">
				{renderers.react(content, react)}
			</section>
			<aside className="sticky top-16 py-8 px-8 w-72 text-lg self-start overflow-y-auto">
				<h2>Table of content</h2>
			</aside>
		</div>
	);
}
