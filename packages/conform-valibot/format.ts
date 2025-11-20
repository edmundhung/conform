import type {
	GenericSchema,
	GenericSchemaAsync,
	InferIssue,
	InferOutput,
	SafeParseResult,
} from 'valibot';
import { appendPathSegment, type FormError } from '@conform-to/dom/future';

export function formatResult<Schema extends GenericSchema | GenericSchemaAsync>(
	result: SafeParseResult<Schema>,
): FormError<string> | null;
export function formatResult<
	Schema extends GenericSchema | GenericSchemaAsync,
	ErrorShape = string,
>(
	result: SafeParseResult<Schema>,
	options: {
		/** Whether to include the parsed value in the returned object */
		includeValue: true;
		/** Custom function to format validation issues for each field */
		formatIssues: (issues: InferIssue<Schema>[], name: string) => ErrorShape[];
	},
): {
	error: FormError<ErrorShape> | null;
	value: InferOutput<Schema> | undefined;
};
export function formatResult<Schema extends GenericSchema | GenericSchemaAsync>(
	result: SafeParseResult<Schema>,
	options: {
		includeValue: true;
		formatIssues?: undefined;
	},
): {
	error: FormError<string> | null;
	value: InferOutput<Schema> | undefined;
};
export function formatResult<
	Schema extends GenericSchema | GenericSchemaAsync,
	ErrorShape = string,
>(
	result: SafeParseResult<Schema>,
	options: {
		includeValue?: false;
		formatIssues: (issues: InferIssue<Schema>[], name: string) => ErrorShape[];
	},
): FormError<ErrorShape> | null;
export function formatResult<
	Schema extends GenericSchema | GenericSchemaAsync,
	ErrorShape = string,
>(
	result: SafeParseResult<Schema>,
	options?: {
		includeValue?: boolean;
		formatIssues?: (issues: InferIssue<Schema>[], name: string) => ErrorShape[];
	},
):
	| FormError<string | ErrorShape>
	| {
			error: FormError<string | ErrorShape> | null;
			value: InferOutput<Schema> | undefined;
	  }
	| null {
	let error: FormError<string | ErrorShape> | null = null;

	if (!result.success) {
		const errorByName: Record<string, InferIssue<Schema>[]> = {};
		for (const issue of result.issues) {
			if (!issue.path) {
				errorByName[''] ??= [];
				errorByName[''].push(issue);
				continue;
			}

			const name = issue.path.reduce<string>((name, segment) => {
				if (
					typeof segment.key !== 'string' &&
					typeof segment.key !== 'number'
				) {
					throw new Error(
						`Only string or numeric path segment schemes are supported. Received segment: ${segment.key}`,
					);
				}
				return appendPathSegment(name, segment.key);
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
			value: result.success ? result.output : undefined,
		};
	}

	return error;
}
