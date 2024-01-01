import {
	type LoaderFunctionArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getFileContent } from '~/context';
import { parse } from '~/markdoc';
import { Markdown } from '~/components';
import { formatTitle } from '~/util';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return [
		{
			title: `Conform Guide - ${formatTitle(params.page ?? '')}`,
		},
	];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
	const readme = await getFileContent(context, `docs/${params.page}.md`);

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
