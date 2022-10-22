import {
	type LoaderArgs,
	type HeadersFunction,
	type MetaFunction,
	json,
} from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getFile } from '~/octokit';
import { Markdown, Sandbox } from '~/components';
import { formatTitle, isGetStartedGuide, notFound } from '~/util';

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	return loaderHeaders;
};

export const meta: MetaFunction = ({ params }) => {
	return {
		title: `Conform Guide - ${formatTitle(params.name ?? '')} integrations`,
	};
};

export async function loader({ params, context }: LoaderArgs) {
	if (isGetStartedGuide(params.name)) {
		throw notFound();
	}

	const branch = getBranch(context);
	const readme = await getFile(
		`docs/integrations/${params.name}/README.md`,
		branch,
	);

	return json(
		{
			src: `edmundhung/conform/tree/${branch}/docs/integrations/${params.name}`,
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
