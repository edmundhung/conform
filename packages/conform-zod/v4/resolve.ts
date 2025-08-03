import type { ZodSafeParseResult, core } from 'zod/v4';
import type { FormError } from '@conform-to/dom/future';
import { appendPathSegment } from '@conform-to/dom/future';

export function resolveZodResult<Output, Input = Output>(
	result: ZodSafeParseResult<Output>,
): FormError<Input, string[]> | null;
export function resolveZodResult<Output, Input>(
	result: ZodSafeParseResult<Output>,
	options: {
		includeValue: true;
		formatIssues?: undefined;
	},
): {
	error: FormError<Input, string[]> | null;
	value: Output | undefined;
};
export function resolveZodResult<Output, Input = Output, ErrorShape = string[]>(
	result: ZodSafeParseResult<Output>,
	options: {
		includeValue: true;
		formatIssues: (issue: core.$ZodIssue[], name: string) => ErrorShape;
	},
): {
	error: FormError<Input, ErrorShape> | null;
	value: Output | undefined;
};
export function resolveZodResult<Output, Input = Output, ErrorShape = string[]>(
	result: ZodSafeParseResult<Output>,
	options: {
		includeValue?: false;
		formatIssues: (issue: core.$ZodIssue[], name: string) => ErrorShape;
	},
): FormError<Input, ErrorShape> | null;
export function resolveZodResult<Output, Input = Output, ErrorShape = string[]>(
	result: ZodSafeParseResult<Output>,
	options?: {
		includeValue?: boolean;
		formatIssues?: (issue: core.$ZodIssue[], name: string) => ErrorShape;
	},
):
	| FormError<Input, Array<string> | ErrorShape>
	| null
	| {
			error: FormError<Input, Array<string> | ErrorShape> | null;
			value: Output | undefined;
	  } {
	let error: FormError<Input, Array<string> | ErrorShape> | null = null;
	let value: Output | undefined = undefined;

	if (!result.success) {
		const errorByName: Record<string, core.$ZodIssue[]> = {};

		for (const issue of result.error.issues) {
			const name = issue.path.reduce<string>((name, segment) => {
				if (typeof segment === 'symbol') {
					throw new Error(
						'Symbol path segments are not supported. Recived path: ' +
							issue.path,
					);
				}

				return appendPathSegment(name, segment);
			}, '');

			errorByName[name] ??= [];
			errorByName[name].push(issue);
		}

		const { '': formErrors = null, ...fieldErrors } = Object.entries(
			errorByName,
		).reduce<Record<string, Array<string> | ErrorShape>>(
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
