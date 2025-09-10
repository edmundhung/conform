import {
	type BaseIssue,
	GenericSchema,
	GenericSchemaAsync,
	SafeParseResult,
} from 'valibot';
import { appendPathSegment, type FormError } from '@conform-to/dom/future';

export function formatResult(
	result: SafeParseResult<GenericSchema | GenericSchemaAsync>,
): FormError<string> | null;
export function formatResult<Output, ErrorShape = string>(
	result: SafeParseResult<GenericSchema | GenericSchemaAsync>,
	options: {
		/** Whether to include the parsed value in the returned object */
		includeValue: true;
		/** Custom function to format validation issues for each field */
		formatIssues: (issue: BaseIssue<unknown>[], name: string) => ErrorShape[];
	},
): {
	error: FormError<ErrorShape> | null;
	value: Output | undefined;
};
export function formatResult<Output>(
	result: SafeParseResult<GenericSchema | GenericSchemaAsync>,
	options: {
		includeValue: true;
		formatIssues?: undefined;
	},
): {
	error: FormError<string> | null;
	value: Output | undefined;
};
export function formatResult<ErrorShape = string>(
	result: SafeParseResult<GenericSchema | GenericSchemaAsync>,
	options: {
		includeValue?: false;
		formatIssues: (issue: BaseIssue<unknown>[], name: string) => ErrorShape[];
	},
): FormError<ErrorShape> | null;
export function formatResult<Output, ErrorShape = string>(
	result: SafeParseResult<GenericSchema | GenericSchemaAsync>,
	options?: {
		includeValue?: boolean;
		formatIssues?: (issue: BaseIssue<unknown>[], name: string) => ErrorShape[];
	},
):
	| FormError<string | ErrorShape>
	| {
			error: FormError<string | ErrorShape> | null;
			value: Output | undefined;
	  }
	| null {
	let error: FormError<string | ErrorShape> | null = null;

	if (!result.success) {
		const errorByName: Record<string, BaseIssue<unknown>[]> = {};
		for (const issue of result.issues) {
			if (!issue.path) {
				errorByName[''] ??= [];
				errorByName[''].push(issue);
				continue;
			}

			const name = issue.path.reduce<string>((name, segment) => {
				return appendPathSegment(name, segment.key as string | number);
			}, '');

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
	}

	if (options?.includeValue) {
		return {
			error,
			value: result.success ? (result.output as Output) : undefined,
		};
	}

	return error;
}
