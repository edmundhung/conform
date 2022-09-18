import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';
import { Markdown, Sandbox } from '~/components';

export async function loader({ params, context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(branch, `examples/${params.page}`);

	return json({
		src: `edmundhung/conform/tree/${branch}/examples/${params.page}`,
		content: parse(atob(readme.content)),
	});
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
