import {
	type LoaderFunctionArgs,
	type HeadersFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getFileContent } from '~/context';
import { parse } from '~/markdoc';
import { Markdown } from '~/components';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export async function loader({ context }: LoaderFunctionArgs) {
	const readme = await getFileContent(context, 'README.md');

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

export default function Index() {
	const { content } = useLoaderData<typeof loader>();

	return <Markdown content={content} />;
}
