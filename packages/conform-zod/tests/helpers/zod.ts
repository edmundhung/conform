import type { util } from 'zod/v4/core';
import { formatPaths } from '@conform-to/dom';
import { SafeParseReturnType } from 'zod';

export function getResult<Output>(
	result: util.SafeParseResult<Output> | SafeParseReturnType<any, Output>,
):
	| { success: false; error: Record<string, string[]> }
	| { success: true; data: Output } {
	if (result.success) {
		return { success: true, data: result.data };
	}

	const error: Record<string, string[]> = {};

	for (const issue of result.error.issues) {
		const name = formatPaths(
			issue.path.map((path) => {
				if (typeof path === 'symbol') {
					throw new Error(
						'@conform-to/zod does not support symbol paths. Please use a string or number instead.',
					);
				}
				return path;
			}),
		);

		error[name] ??= [];
		error[name].push(issue.message);
	}

	return { success: false, error };
}
