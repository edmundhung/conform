import { data } from 'react-router';
import type { Route } from './+types/$';
import { collectHeadings, parse } from '~/markdoc';
import { Markdown } from '~/components';
import { getDocPath, formatTitle, getFileContent } from '~/util';

export const headers: Route.HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: Route.MetaFunction = ({ loaderData }) => {
	return [
		{
			title: formatTitle(loaderData?.toc.title),
		},
	];
};

export async function loader({ params, context }: Route.LoaderArgs) {
	const file = `${getDocPath(context)}/${params['*']}.md`;
	const readme = await getFileContent(context, file);
	const content = parse(readme);

	return data(
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

export default function Page({ loaderData }: Route.ComponentProps) {
	const { content } = loaderData;

	return <Markdown content={content} />;
}
