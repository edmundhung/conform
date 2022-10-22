import {
	type LoaderArgs,
	type HeadersFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getFile } from '~/octokit';
import { Markdown } from '~/components';
import { getIntroduction } from '~/util';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export async function loader({ context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getFile('/README.md', branch);
	const introduction = getIntroduction(atob(readme.content));

	return json(
		{
			src: `edmundhung/conform/tree/${branch}/docs/examples/basics`,
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
	const { content } = useLoaderData<typeof loader>();

	return <Markdown content={content} />;
}
