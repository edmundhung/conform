import {
	type LoaderArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { Markdown } from '~/components';
import { getFileContent } from '~/context';
import { formatTitle } from '~/util';
import { parse } from '~/markdoc';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return {
		title: `Conform Guide - ${formatTitle(params.package ?? '')} API Reference`,
	};
};

export async function loader({ params, context }: LoaderArgs) {
	const readme = await getFileContent(
		context,
		`packages/conform-${params.package}/README.md`,
	);

	return json(
		{
			content: parse(atob(readme)),
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=60',
			},
		},
	);
}

export default function Page() {
	let { content } = useLoaderData<typeof loader>();

	return <Markdown content={content} />;
}
