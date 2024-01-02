import '@remix-run/dev';
import '@remix-run/cloudflare';
import '@cloudflare/workers-types';

interface Env {
	ENVIRONMENT?: 'development';
	GITHUB_ACCESS_TOKEN?: string;
	CF_PAGES_BRANCH?: string;
	CACHE: KVNamespace;
}

declare module '@remix-run/cloudflare' {
	export interface AppLoadContext {
		env: Env;
		waitUntil(promise: Promise<void>): void;
	}
}
