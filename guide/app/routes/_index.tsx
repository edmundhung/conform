import { data } from 'react-router';
import type { Route } from './+types/_index';
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

export async function loader({ context }: Route.LoaderArgs) {
	const file = `${getDocPath(context)}/overview.md`;
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
				// Keep the page in the Worker cache for an hour
				'Cloudflare-CDN-Cache-Control': 'max-age=3600',
			},
		},
	);
}

export default function Index({ loaderData }: Route.ComponentProps) {
	const { content } = loaderData;

	return <Markdown content={content} />;
}
