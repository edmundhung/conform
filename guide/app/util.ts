import type { Endpoints } from '@octokit/types';
import type { AppLoadContext } from '@remix-run/cloudflare';

interface Language {
	code: string;
	label: string;
	docPath: string;
	domain: string;
	isDecodeUtf8: boolean;
}

export const allLanguages: Language[] = [
	{
		code: 'en',
		label: 'en',
		docPath: 'docs',
		domain: 'conform.guide',
		isDecodeUtf8: false,
	},
	{
		code: 'ja',
		label: 'ja',
		docPath: 'docs/ja',
		domain: 'ja.conform.guide',
		isDecodeUtf8: true,
	},
];

export function invariant(
	expectedCondition: boolean,
	message: string,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw new Error(message);
	}
}

export function getMetadata(context: AppLoadContext) {
	const branch = getBranch(context);
	return {
		owner: 'edmundhung',
		repo: 'conform',
		ref: branch,
		language: getLanguage(context.cloudflare.env.LANGUAGE),
	};
}

export function getEnv(context: AppLoadContext) {
	return context.env;
}

export function getGitHubToken(context: AppLoadContext): string | undefined {
	return context.cloudflare.env.GITHUB_ACCESS_TOKEN;
}

export function getBranch(context: AppLoadContext): string {
	return context.cloudflare.env.CF_PAGES_BRANCH ?? 'main';
}

export function getCache(context: AppLoadContext): KVNamespace {
	return context.cloudflare.env.CACHE;
}

export const getDocPath = (context: AppLoadContext) => {
	const { docPath } = getMetadata(context).language;
	return docPath;
};

export function getLanguageCode(url: string): string | undefined {
	const { hostname } = new URL(url);
	const language = allLanguages.find((lang) => lang.domain === hostname);

	return language?.code;
}

export function getLanguage(code: string | undefined): Language {
	const language = allLanguages.find((lang) => lang.code === code);
	return language ?? allLanguages[0]; // default to English
}

function base64DecodeUtf8(base64String: string) {
	const binaryString = atob(base64String);
	const charCodeArray = Array.from(binaryString).map((char) =>
		char.charCodeAt(0),
	);
	const uintArray = new Uint8Array(charCodeArray);
	return new TextDecoder('utf-8').decode(uintArray);
}

export async function getFileContent(
	context: AppLoadContext,
	path: string,
): Promise<string> {
	const { ref, owner, repo, language } = getMetadata(context);
	const cache = getCache(context);
	const cacheKey = `${ref}/${path}`;

	let content = await cache.get(cacheKey);

	if (!content) {
		const auth = getGitHubToken(context);
		const file = await downloadFile({
			auth,
			ref,
			path,
			owner,
			repo,
		});

		// Japanese characters including UTF-8 are garbled, so convert to binary string before decoding
		content = language.isDecodeUtf8
			? base64DecodeUtf8(file.content)
			: atob(file.content);
		context.cloudflare.ctx.waitUntil(
			cache.put(cacheKey, content, {
				expirationTtl: 3600,
			}),
		);
	}

	return content;
}

export function getGitHubApiHeaders(auth: string | undefined) {
	const headers = new Headers({
		Accept: 'application/vnd.github+json',
		'User-Agent': 'Conform Guide',
	});

	if (auth) {
		headers.set('Authorization', `Bearer ${auth}`);
	}

	return headers;
}

export async function downloadFile(options: {
	auth?: string;
	ref?: string;
	path: string;
	owner: string;
	repo: string;
}) {
	const resposne = await fetch(
		`https://api.github.com/repos/${options.owner}/${options.repo}/contents/${options.path}?ref=${options.ref}`,
		{
			headers: getGitHubApiHeaders(options.auth),
		},
	);

	if (resposne.status === 404) {
		throw notFound();
	}

	const file: Endpoints['GET /repos/{owner}/{repo}/contents/{path}']['response']['data'] =
		await resposne.json();

	if (Array.isArray(file) || file.type !== 'file') {
		throw notFound();
	}

	return file;
}

export function formatTitle(title: string | null | undefined): string {
	return title ? `Conform / ${title}` : 'Conform Guide';
}

export function notFound() {
	return new Response('Not found', { status: 404, statusText: 'Not Found' });
}

export const logo = [
	' ███████╗  ██████╗  ███╗  ██╗ ████████╗  ██████╗  ███████╗  ███╗ ███╗',
	'██╔═════╝ ██╔═══██╗ ████╗ ██║ ██╔═════╝ ██╔═══██╗ ██╔═══██╗ ████████║',
	'██║       ██║   ██║ ██╔██╗██║ ███████╗  ██║   ██║ ███████╔╝ ██╔██╔██║',
	'██║       ██║   ██║ ██║╚████║ ██╔════╝  ██║   ██║ ██╔═══██╗ ██║╚═╝██║',
	'╚███████╗ ╚██████╔╝ ██║ ╚███║ ██║       ╚██████╔╝ ██║   ██║ ██║   ██║',
	' ╚══════╝  ╚═════╝  ╚═╝  ╚══╝ ╚═╝        ╚═════╝  ╚═╝   ╚═╝ ╚═╝   ╚═╝',
].join('\n');
