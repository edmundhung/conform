import { Octokit } from '@octokit/core';
import { notFound } from '~/util';

export async function getGitHubReadme(ref = 'main', dir = '') {
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
			throw notFound();
		}

		throw e;
	}
}
