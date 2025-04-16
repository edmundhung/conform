import type { util } from '@zod/core';
import { formatPaths } from '@conform-to/dom';

export function getResult<Output>(
	result: util.SafeParseResult<Output>,
):
	| { success: false; error: Record<string, string[]> }
	| { success: true; data: Output } {
	if (result.success) {
		return { success: true, data: result.data };
	}

	const error: Record<string, string[]> = {};

	for (const issue of result.error.issues) {
		const name = formatPaths(issue.path);

		error[name] ??= [];
		error[name].push(issue.message);
	}

	return { success: false, error };
}
