import {
	type LoaderArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getFileContent } from '~/context';
import { parse } from '~/markdoc';
import { Markdown } from '~/components';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return {
		title: 'Conform Guide',
	};
};

export async function loader({ context }: LoaderArgs) {
	const readme = await getFileContent(context, `docs/README.md`);

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
