import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { Markdown } from '~/components';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';

export async function loader({ params, context }: LoaderArgs) {
	const readme = await getGitHubReadme(
		`packages/conform-${params.package}`,
		(context as any).env?.CF_PAGES_BRANCH,
	);

	return json({
		content: parse(atob(readme.content)),
	});
}

export default function Page() {
	let { content } = useLoaderData<typeof loader>();

	return (
		<>
			<Markdown content={content} />
		</>
	);
}
