import {
	type LoaderArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { Markdown } from '~/components';
import { getBranch } from '~/context';
import { formatTitle } from '~/format';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return {
		title: `Conform Guide - ${formatTitle(params.package ?? '')} API Reference`,
	};
};

export async function loader({ params, context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(
		branch,
		`packages/conform-${params.package}`,
	);

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

	return (
		<>
			<Markdown content={content} />
		</>
	);
}
