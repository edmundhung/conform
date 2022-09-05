import { Octokit } from '@octokit/core';
import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { parse, render } from '~/markdoc';

async function getGitHubReadme(dir: string, ref = 'main') {
	const octokit = new Octokit();
	const file = await octokit.request('GET /repos/{owner}/{repo}/readme/{dir}', {
		owner: 'edmundhung',
		repo: 'conform',
		dir,
		ref,
	});

	return file.data;
}

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
			<section className="prose prose-zinc dark:prose-invert max-w-none pr-72">
				{render(content)}
			</section>
		</div>
	);
}
