import { execSync } from 'node:child_process';
import { bindings, defineConfig } from 'cf/config';

export default defineConfig(({ mode, isPreview }) => ({
	worker: {
		name: 'conform-guide',
		entrypoint: './workers/app.ts',
		compatibilityDate: '2026-10-23',
		observability: {
			enabled: true,
		},
		previewUrls: true,
		cache: {
			enabled: true,
		},
		domains: ['conform.guide', 'ja.conform.guide'],
		env: {
			BRANCH: bindings.text(getBranch(mode)),
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
		try {
			const branch = execSync('git branch --show-current', {
				encoding: 'utf-8',
			}).trim();

			if (branch) {
				return branch;
			}
		} catch {
			// Git is unavailable or this is not a repository
		}
	}

	return 'main';
}
