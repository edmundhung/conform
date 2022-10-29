import type { AppLoadContext } from '@remix-run/cloudflare';
import { getFile } from './octokit';

export function getEnv({ env }: AppLoadContext): Record<string, any> {
	if (typeof env !== 'object' || env === null) {
		return {};
	}

	return Object(env);
}

export function getGitHubToken(context: AppLoadContext): string | undefined {
	const env = getEnv(context);

	return env.GITHUB_ACCESS_TOKEN;
}

export function getBranch(context: AppLoadContext): string {
	const env = getEnv(context);

	return env.CF_PAGES_BRANCH ?? 'main';
}

export function getCache(context: AppLoadContext): KVNamespace {
	const env = getEnv(context);

	return env.CACHE;
}

export function waitUntil(
	context: AppLoadContext,
	promise: Promise<any>,
): void {
	(context as any).waitUntil(promise);
}

export async function getFileContent(
	context: AppLoadContext,
	path: string,
): Promise<string> {
	const ref = getBranch(context);
	const auth = getGitHubToken(context);
	const cache = getCache(context);
	const cacheKey = `${ref}/${path}`;

	let content = await cache.get(cacheKey);

	if (!content) {
		const file = await getFile(path, { auth, ref });

		content = file.content;
		waitUntil(
			context,
			cache.put(cacheKey, content, {
				expirationTtl: 300,
			}),
		);
	}

	return content;
}
