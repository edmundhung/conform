import type {
	GenericSchema,
	GenericSchemaAsync,
	SafeParseResult,
} from 'valibot';
import { formatPaths } from '@conform-to/dom';

export function getResult<Output>(
	result: SafeParseResult<GenericSchema | GenericSchemaAsync>,
):
	| { success: false; error: Record<string, string[]> }
	| { success: true; data: Output } {
	if (result.success) {
		return { success: true, data: result.output as Output };
	}

	const error: Record<string, string[]> = {};

	for (const issue of result.issues) {
		const name = formatPaths(
			issue.path?.map((d) => d.key as string | number) ?? [],
		);

		error[name] ??= [];
		error[name]?.push(issue.message);
	}

	return { success: false, error };
}
