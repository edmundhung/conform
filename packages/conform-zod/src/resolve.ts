import type { SafeParseReturnType, ZodIssue } from 'zod';
import { formatPaths, type FormError } from 'conform-dom';

export function resolveZodResult<Input, Output>(
	result: SafeParseReturnType<Input, Output>,
): {
	value?: Output;
	error: FormError<Input, string[]> | null;
};
export function resolveZodResult<Input, Output, ErrorShape>(
	result: SafeParseReturnType<Input, Output>,
	formatIssues: (issue: ZodIssue[], name: string) => ErrorShape,
): {
	value?: Output;
	error: FormError<Input, ErrorShape> | null;
};
export function resolveZodResult<Input, Output, ErrorShape>(
	result: SafeParseReturnType<Input, Output>,
	formatIssues?: (issue: ZodIssue[], name: string) => ErrorShape,
): {
	value?: Output;
	error: FormError<Input, Array<string> | ErrorShape> | null;
} {
	if (result.success) {
		return {
			value: result.data,
			error: null,
		};
	}

	const error: Record<string, ZodIssue[]> = {};

	for (const issue of result.error.issues) {
		const name = formatPaths(issue.path);

		error[name] ??= [];
		error[name].push(issue);
	}

	const { '': formError = null, ...fieldError } = Object.entries(error).reduce<
		Record<string, Array<string> | ErrorShape>
	>((result, [name, issues]) => {
		result[name] = formatIssues
			? formatIssues(issues, name)
			: issues.map((issue) => issue.message);

		return result;
	}, {});

	return {
		error: {
			formError,
			fieldError,
		},
	};
}