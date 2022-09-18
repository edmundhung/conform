import {
	type LoaderArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';
import { Markdown, Sandbox } from '~/components';
import { formatTitle } from '~/format';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return {
		title: `Conform Guide - ${formatTitle(params.integration ?? '')} example`,
	};
};

export async function loader({ params, context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(
		branch,
		`examples/${params.integration}`,
	);

	return json(
		{
			src: `edmundhung/conform/tree/${branch}/examples/${params.integration}`,
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
	let { src, content } = useLoaderData<typeof loader>();

	return (
		<>
			<Markdown content={content} />
			<Sandbox title="Sandbox" src={src} />
		</>
	);
}
