import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse, Markdoc } from '~/markdoc';
import { getGitHubReadme } from '~/octokit';
import { Sandbox } from '~/sandbox';

export async function loader({ params, context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(
		`examples/${params.integration}`,
		branch,
	);

	return json({
		path: `edmundhung/conform/tree/${branch}/examples/${params.integration}`,
		content: parse(atob(readme.content)),
	});
}

export default function Page() {
	let { path, content } = useLoaderData<typeof loader>();

	return (
		<>
			<Markdoc content={content} />
			<Sandbox title="Sandbox" path={path} />
		</>
	);
}
