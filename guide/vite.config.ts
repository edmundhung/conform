import {
	unstable_vitePlugin as remix,
	unstable_cloudflarePreset as cloudflare,
} from '@remix-run/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { exec } from 'node:child_process';

function getCurrentBranchName() {
	return new Promise<string>((resolve, reject) => {
		exec('git branch --show-current', (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				resolve(stdout.trim());
			}
		});
	});
}

const branch = await getCurrentBranchName();

export default defineConfig({
	plugins: [
		remix({
			presets: [
				cloudflare({
					getRemixDevLoadContext(context) {
						return {
							...context,
							env: {
								CF_PAGES_BRANCH: branch,
								// @ts-expect-error The context should have the env property
								...context.env,
							},
						};
					},
				}),
			],
			future: {
				v3_relativeSplatPath: true,
			},
		}),
		tsconfigPaths(),
	],
	ssr: {
		resolve: {
			externalConditions: ['workerd', 'worker'],
		},
	},
});
