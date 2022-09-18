import {
	type LoaderArgs,
	type HeadersFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';
import { Markdown, Sandbox } from '~/components';
import { getIntroduction } from '~/format';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export async function loader({ context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(branch);
	const introduction = getIntroduction(atob(readme.content));

	return json(
		{
			src: `edmundhung/conform/tree/${branch}/examples/basics`,
			content: parse(introduction),
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		},
	);
}

export default function Index() {
	const { src, content } = useLoaderData<typeof loader>();

	return (
		<>
			<Markdown content={content} />
			<Sandbox title="Quick start" src={src} />
		</>
	);
}
