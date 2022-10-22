import {
	type LoaderArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getFile } from '~/octokit';
import { Markdown } from '~/components';
import { formatTitle } from '~/util';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return {
		title: `Conform Guide - ${formatTitle(params.page ?? '')}`,
	};
};

export async function loader({ params, context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getFile(`docs/${params.page}.md`, branch);

	return json(
		{
			content: parse(atob(readme.content)),
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		},
	);
}

export default function Page() {
	let { content } = useLoaderData<typeof loader>();

	return <Markdown content={content} />;
}
