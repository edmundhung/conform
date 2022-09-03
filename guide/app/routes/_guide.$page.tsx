import {
	type LinksFunction,
	type LoaderArgs,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { parse, render } from '~/markdoc';
import stylesUrl from '~/styles/code.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

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

	return json({
		content: parse(markdown),
	});
}

export default function Page() {
	let { content } = useLoaderData<typeof loader>();

	return (
		<div className="flex">
			<div className="flex-1 py-8">
				<section className="prose prose-zinc dark:prose-invert max-w-none">
					{render(content)}
				</section>
			</div>
			<aside className="sticky top-16 flex-none py-8 px-8 w-72 text-lg self-start overflow-y-auto">
				<h2>Table of content</h2>
			</aside>
		</div>
	);
}
