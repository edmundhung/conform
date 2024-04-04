import {
	type LoaderFunctionArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { collectHeadings, parse } from '~/markdoc';
import { Markdown } from '~/components';
import { getDocPath, formatTitle, getFileContent } from '~/util';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: formatTitle(data?.toc.title),
		},
	];
};

export async function loader({ params, context }: LoaderFunctionArgs) {
	const file = `${getDocPath(context)}/${params['*']}.md`;
	const readme = await getFileContent(context, file);
	const content = parse(readme);

	return json(
		{
			file,
			content,
			toc: collectHeadings(content),
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
