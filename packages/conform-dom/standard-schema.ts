import type { FormError } from './types';
import { formatPath } from './formdata';
import { isPlainObject } from './util';

/**
 * A widened version of `StandardSchemaV1.Issue`.
 *
 * The `path` elements and `PropertyKey` fields are loosened to `unknown`
 * to stay compatible with Valibot's native issue type.
 */
export type StandardSchemaIssue = {
	readonly message: string;
	readonly path?: ReadonlyArray<unknown | { key: unknown }> | undefined;
};

export function formatIssues(
	issues: Readonly<StandardSchemaIssue[]>,
): FormError<string> {
	const error: FormError<string> = {
		formErrors: [],
		fieldErrors: {},
	};

	for (const issue of issues) {
		const segments =
			issue.path?.map((segment) => {
				const path =
					isPlainObject(segment) && 'key' in segment ? segment.key : segment;

				if (typeof path !== 'string' && typeof path !== 'number') {
					throw new Error(
						`Only string or numeric path segment schemes are supported. Received segment: ${String(
							path,
						)}`,
					);
				}

				return path;
			}) ?? [];
		const name = formatPath(segments ?? []);

		if (!name) {
			error.formErrors.push(issue.message);
		} else {
			error.fieldErrors[name] ??= [];
			error.fieldErrors[name].push(issue.message);
		}
	}

	return error;
}
