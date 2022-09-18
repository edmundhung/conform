import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { Markdown } from '~/components';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';

export async function loader({ params, context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(
		branch,
		`packages/conform-${params.package}`,
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
