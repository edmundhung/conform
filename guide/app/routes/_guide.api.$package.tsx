import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { parse, Markdoc } from '~/markdoc';
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
		<div className="py-8">
			<Markdoc content={content} />
		</div>
	);
}