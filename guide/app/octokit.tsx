import { Octokit } from '@octokit/core';

export async function getGitHubReadme(dir: string, ref = 'main') {
	const octokit = new Octokit();
	try {
		const file = await octokit.request(
			'GET /repos/{owner}/{repo}/readme/{dir}',
			{
				owner: 'edmundhung',
				repo: 'conform',
				dir,
				ref,
			},
		);

		return file.data;
	} catch (e) {
		if ((e as any).status === 404) {
			throw new Response('Not found', { status: 404, statusText: 'Not Found' });
		}

		throw e;
	}
}
