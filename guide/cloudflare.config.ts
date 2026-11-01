import { execSync } from 'node:child_process';
import { bindings, defineConfig } from 'cf/config';

export default defineConfig(({ mode, isPreview }) => ({
	accountId: 'c63d756a160ad09cd9a82553c77e9174',
	worker: {
		name: 'conform-guide',
		entrypoint: './workers/app.ts',
		compatibilityDate: '2026-10-23',
		observability: {
			enabled: true,
		},
		previewUrls: true,
		domains: ['conform.guide', 'ja.conform.guide'],
		env: {
			BRANCH: bindings.text(getBranch(mode)),
			CACHE: bindings.kv({ id: 'e5e7842b37f7459ba1053886e132e03d' }),
			// Previews fetch the docs from GitHub without a token
			GITHUB_ACCESS_TOKEN: !isPreview && bindings.secret(),
		},
	},
}));

// The docs are fetched from GitHub at this branch
function getBranch(mode: string | undefined): string {
	// Set by GitHub Actions
	const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;

	if (branch) {
		return branch;
	}

	if (mode === 'development') {
		const branch = execSync('git branch --show-current', {
			encoding: 'utf-8',
		}).trim();

		if (branch) {
			return branch;
		}
	}

	return 'main';
}
