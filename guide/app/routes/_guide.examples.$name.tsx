import {
	type LoaderFunctionArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { parse } from '~/markdoc';
import { Markdown } from '~/components';
import { formatTitle, getFileContent } from '~/util';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return [
		{
			title: `Conform Guide - ${formatTitle(params.name ?? '')} example`,
		},
	];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
	const readme = await getFileContent(
		context,
		`examples/${params.name}/README.md`,
	);

	return json(
		{
			content: parse(readme),
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
