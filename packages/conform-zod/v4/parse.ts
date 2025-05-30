import {
	type Intent,
	type Submission,
	formatPaths,
	parse,
} from '@conform-to/dom';
import type { ZodType } from 'zod/v4';
import type { ZodMiniType } from 'zod/v4-mini';
import type {
	$ZodIssue,
	$ZodError,
	$ZodErrorMap,
	output,
	input,
	util,
} from 'zod/v4/core';
import { coerceFormValue } from './coercion';

type ZodSchemaType = ZodType | ZodMiniType;

function getError<FormError>(
	zodError: $ZodError,
	formatError: (issues: Array<$ZodIssue>) => FormError,
): Record<string, FormError | null> | null {
	const result: Record<string, $ZodIssue[] | null> = {};

	for (const issue of zodError.issues) {
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

		switch (issue.message) {
			case conformZodMessage.VALIDATION_UNDEFINED:
				return null;
			case conformZodMessage.VALIDATION_SKIPPED:
				result[name] = null;
				break;
			default: {
				const issues = result[name];

				if (issues !== null) {
					if (issues) {
						result[name] = issues.concat(issue);
					} else {
						result[name] = [issue];
					}
				}
				break;
			}
		}
	}

	return Object.entries(result).reduce<Record<string, FormError | null>>(
		(result, [name, issues]) => {
			result[name] = issues ? formatError(issues) : null;

			return result;
		},
		{},
	);
}

export function parseWithZod<Schema extends ZodSchemaType>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
		error?: $ZodErrorMap;
		disableAutoCoercion?: boolean;
	},
): Submission<input<Schema>, string[], output<Schema>>;
export function parseWithZod<Schema extends ZodSchemaType, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: false;
		error?: $ZodErrorMap;
		formatError: (issues: Array<$ZodIssue>) => FormError;
		disableAutoCoercion?: boolean;
	},
): Submission<input<Schema>, FormError, output<Schema>>;
export function parseWithZod<Schema extends ZodSchemaType>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
		error?: $ZodErrorMap;
		disableAutoCoercion?: boolean;
	},
): Promise<Submission<input<Schema>, string[], output<Schema>>>;
export function parseWithZod<Schema extends ZodSchemaType, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async: true;
		error?: $ZodErrorMap;
		formatError: (issues: Array<$ZodIssue>) => FormError;
		disableAutoCoercion?: boolean;
	},
): Promise<Submission<input<Schema>, FormError, output<Schema>>>;
export function parseWithZod<Schema extends ZodSchemaType, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		schema: Schema | ((intent: Intent | null) => Schema);
		async?: boolean;
		error?: $ZodErrorMap;
		formatError?: (issues: Array<$ZodIssue>) => FormError;
		disableAutoCoercion?: boolean;
	},
):
	| Submission<input<Schema>, FormError | string[], output<Schema>>
	| Promise<Submission<input<Schema>, FormError | string[], output<Schema>>> {
	return parse(payload, {
		resolve(payload, intent) {
			const error = options.error;
			const baseSchema =
				typeof options.schema === 'function'
					? options.schema(intent)
					: options.schema;
			const schema = !options.disableAutoCoercion
				? coerceFormValue(baseSchema)
				: baseSchema;

			const resolveSubmission = (
				result: util.SafeParseResult<output<Schema>>,
			) => {
				return {
					value: result.success ? result.data : undefined,
					error: !result.success
						? getError<FormError | string[]>(
								result.error,
								options.formatError ??
									((issues) => issues.map((issue) => issue.message)),
							)
						: undefined,
				};
			};

			return options.async
				? schema
						.safeParseAsync(payload, { error })
						.then((result) => resolveSubmission(result))
				: resolveSubmission(schema.safeParse(payload, { error }));
		},
	});
}

export const conformZodMessage = {
	VALIDATION_SKIPPED: '__skipped__',
	VALIDATION_UNDEFINED: '__undefined__',
};
