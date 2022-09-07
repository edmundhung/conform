import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { parse, Markdoc } from '~/markdoc';
import { getGitHubReadme } from '~/octokit';
import { Sandbox } from '~/sandbox';

export async function loader({ params, context }: LoaderArgs) {
	const readme = await getGitHubReadme(
		`examples/${params.page}`,
		(context as any).env?.CF_PAGES_BRANCH,
	);

	return json({
		path: `edmundhung/conform/tree/v0.3.0/examples/${params.page}`,
		content: parse(atob(readme.content)),
	});
}

export default function Page() {
	let { path, content } = useLoaderData<typeof loader>();

	return (
		<div className="py-8">
			<Markdoc content={content} />
			<Sandbox title="Sandbox" path={path} />
		</div>
	);
}
