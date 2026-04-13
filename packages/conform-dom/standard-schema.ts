import type { FormError, StandardSchemaIssue } from './types';
import { formatPath } from './formdata';
import { isPlainObject } from './util';

export function formatIssues(
	issues: Readonly<StandardSchemaIssue[]>,
): FormError<string[]> {
	const error: FormError<string[]> = {
		formErrors: null,
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
			error.formErrors ??= [];
			error.formErrors.push(issue.message);
		} else {
			error.fieldErrors[name] ??= [];
			error.fieldErrors[name].push(issue.message);
		}
	}

	return error;
}
