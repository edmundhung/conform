import type { AppLoadContext } from '@remix-run/cloudflare';

export function getEnv({
	env,
}: AppLoadContext): Record<string, string | undefined> {
	if (typeof env !== 'object' || env === null) {
		return {};
	}

	return Object(env);
}

export function getBranch(context: AppLoadContext) {
	const env = getEnv(context);

	return env.CF_PAGES_BRANCH ?? 'main';
}
