import type { SafeParseReturnType, ZodIssue } from 'zod';
import type { FormError } from '@conform-to/dom/future';
import { formatPathSegments } from '@conform-to/dom/future';

/**
 * Transforms Zod validation results into Conform's error format.
 *
 * @example
 * ```ts
 * const result = schema.safeParse(formData);
 * const error = formatResult(result);
 * ```
 */
export function formatResult(
	result: SafeParseReturnType<any, any>,
): FormError<string> | null;
export function formatResult<Output, ErrorShape>(
	result: SafeParseReturnType<any, Output>,
	options: {
		/** Whether to include the parsed value in the returned object */
		includeValue: true;
		/** Custom function to format validation issues for each field */
		formatIssues: (issue: ZodIssue[], name: string) => ErrorShape[];
	},
): {
	error: FormError<ErrorShape> | null;
	value: Output | undefined;
};
export function formatResult<Output>(
	result: SafeParseReturnType<any, Output>,
	options: {
		includeValue: true;
		formatIssues?: undefined;
	},
): {
	error: FormError<string> | null;
	value: Output | undefined;
};
export function formatResult<Output, ErrorShape>(
	result: SafeParseReturnType<any, Output>,
	options: {
		includeValue?: false;
		formatIssues: (issue: ZodIssue[], name: string) => ErrorShape[];
	},
): FormError<ErrorShape> | null;
export function formatResult<Output, Input, ErrorShape>(
	result: SafeParseReturnType<Input, Output>,
	options?: {
		includeValue?: boolean;
		formatIssues?: (issue: ZodIssue[], name: string) => ErrorShape[];
	},
):
	| FormError<string | ErrorShape>
	| null
	| {
			error: FormError<string | ErrorShape> | null;
			value: Output | undefined;
	  } {
	let error: FormError<string | ErrorShape> | null = null;
	let value: Output | undefined = undefined;

	if (!result.success) {
		const errorByName: Record<string, ZodIssue[]> = {};

		for (const issue of result.error.issues) {
			const name = formatPathSegments(issue.path);

			errorByName[name] ??= [];
			errorByName[name].push(issue);
		}

		const { '': formErrors = [], ...fieldErrors } = Object.entries(
			errorByName,
		).reduce<Record<string, string[] | ErrorShape[]>>(
			(result, [name, issues]) => {
				result[name] = options?.formatIssues
					? options.formatIssues(issues, name)
					: issues.map((issue) => issue.message);

				return result;
			},
			{},
		);

		error = {
			formErrors,
			fieldErrors,
		};
	} else {
		value = result.data;
	}

	if (!options?.includeValue) {
		return error;
	}

	return {
		error,
		value,
	};
}
