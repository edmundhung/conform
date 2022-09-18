import { type LoaderArgs, json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getBranch } from '~/context';
import { parse } from '~/markdoc.server';
import { getGitHubReadme } from '~/octokit';
import { Markdown, Sandbox } from '~/components';

function getIntroduction(content: string) {
	const lines = [];

	for (const line of content.split('\n')) {
		if (line.startsWith('## ')) {
			break;
		}

		if (line.startsWith('# ')) {
			lines.push('# Conform');
		} else {
			lines.push(line);
		}
	}

	return lines.join('\n');
}

export async function loader({ context }: LoaderArgs) {
	const branch = getBranch(context);
	const readme = await getGitHubReadme(branch);
	const introduction = getIntroduction(atob(readme.content));

	return json({
		src: `edmundhung/conform/tree/${branch}/examples/basics`,
		content: parse(introduction),
	});
}

export default function Index() {
	const { src, content } = useLoaderData<typeof loader>();

	return (
		<>
			<Markdown content={content} />
			<Sandbox title="Quick start" src={src} />
		</>
	);
}
