import { Octokit } from '@octokit/core';
import { notFound } from '~/util';

export async function getFile(
	path: string,
	{ auth, ref = 'main' }: { auth?: string; ref?: string } = {},
) {
	const octokit = new Octokit({ auth });

	try {
		const file = await octokit.request(
			'GET /repos/{owner}/{repo}/contents/{path}',
			{
				owner: 'edmundhung',
				repo: 'conform',
				path,
				ref,
			},
		);

		if (Array.isArray(file.data) || file.data.type !== 'file') {
			throw new Error('The path provided should be pointed to a file');
		}

		return file.data;
	} catch (e) {
		if ((e as any).status === 404) {
			throw notFound();
		}

		throw e;
	}
}
