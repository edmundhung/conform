import { setValue, getPaths } from './formdata';
import {
	FormError,
	FormValue,
	JsonPrimitive,
	Submission,
	SubmissionResult,
} from './type';
import { stripFiles } from './util';

/**
 * Parse `FormData` or `URLSearchParams` into a submission object.
 * This function structures the form values based on the naming convention.
 * It also includes all the field names and the intent if the `intentName` option is provided.
 *
 * @example
 * ```ts
 * const formData = new FormData();
 *
 * formData.append('email', 'test@example.com');
 * formData.append('password', 'secret');
 *
 * parseSubmission(formData)
 * // {
 * //   value: { email: 'test@example.com', password: 'secret' },
 * //   fields: ['email', 'password'],
 * //   intent: null,
 * // }
 *
 * // If you have an intent field
 * formData.append('intent', 'login');
 * parseSubmission(formData, { intentName: 'intent' })
 * // {
 * //   value: { email: 'test@example.com', password: 'secret' },
 * //   fields: ['email', 'password'],
 * //   intent: 'login',
 * // }
 * ```
 */
export function parseSubmission(
	formData: FormData | URLSearchParams,
	options?: {
		intentName?: string;
		skipEntry?: (name: string) => boolean;
	},
): Submission {
	const intentName = options?.intentName;
	const fields = new Set<string>();
	const submission: Submission = {
		value: {},
		fields: [],
		intent: null,
	};

	for (const [name, value] of formData.entries()) {
		if (name !== intentName && !options?.skipEntry?.(name)) {
			setValue(submission.value, getPaths(name), (currentValue: unknown) => {
				if (typeof currentValue === 'undefined') {
					return value;
				} else if (Array.isArray(currentValue)) {
					return currentValue.concat(value);
				} else {
					return [currentValue, value];
				}
			});
			fields.add(name);
		}
	}

	submission.fields = Array.from(fields);

	if (intentName) {
		const intent = formData.get(intentName);

		if (typeof intent === 'string') {
			submission.intent = intent;
		}
	}

	return submission;
}

/**
 * Update the submission with the an optional error or to reset the form value.
 * This function will remove all files in the submission value by default to
 * avoid serialization issues over the network and the overhead of sending files back.
 * You can specify `keepFile: true` to keep the file if needed.
 *
 * @example
 * ```ts
 * // Report the submission with the field errors
 * report(submission, {
 *  error: {
 *    fieldErrors: {
 *      email: ['Invalid email format'],
 *      password: ['Password is required'],
 *    },
 * })
 *
 * // Report the submission with a form error
 * report(submission, {
 *   error: {
 *     formErrors: ['Invalid credentials'],
 *   },
 * })
 *
 * // Reset the form
 * report(submission, {
 *   reset: true,
 * })
 * ```
 */
export function report<FormShape, ErrorShape = string[], Intent = never>(
	submission: Submission,
	options: {
		keepFile?: false;
		error?: Partial<FormError<FormShape, ErrorShape>> | null;
		value?: Record<string, FormValue> | null;
		intent?: Intent | null;
		hideFields?: string[];
		reset?: boolean;
	},
): SubmissionResult<
	FormShape,
	ErrorShape,
	Intent,
	Exclude<JsonPrimitive | FormDataEntryValue, File>
>;
export function report<FormShape, ErrorShape = string[], Intent = never>(
	submission: Submission,
	options: {
		keepFile: true;
		error?: Partial<FormError<FormShape, ErrorShape>> | null;
		value?: Record<string, FormValue> | null;
		intent?: Intent | null;
		hideFields?: string[];
		reset?: boolean;
	},
): SubmissionResult<FormShape, ErrorShape, Intent>;
export function report<FormShape, ErrorShape = string[], Intent = never>(
	submission: Submission,
	options: {
		keepFile?: boolean;
		error?: Partial<FormError<FormShape, ErrorShape>> | null;
		value?: Record<string, FormValue> | null;
		intent?: Intent | null;
		hideFields?: string[];
		reset?: boolean;
	},
): SubmissionResult<FormShape, ErrorShape, Intent> {
	const value = options.reset
		? null
		: typeof options.value === 'undefined' || submission.value === options.value
			? undefined
			: options.value && options.keepFile
				? stripFiles(options.value)
				: options.value;
	const error = !options.error
		? options.error
		: {
				formErrors: options.error.formErrors ?? null,
				fieldErrors: options.error.fieldErrors ?? {},
			};

	if (options.hideFields) {
		for (const name of options.hideFields) {
			const paths = getPaths(name);

			setValue(submission.value, paths, () => undefined);
			if (value) {
				setValue(value, paths, () => undefined);
			}
		}
	}

	return {
		submission: options.keepFile
			? submission
			: {
					...submission,
					value: stripFiles(submission.value),
				},
		value,
		error,
		intent: options.intent,
	};
}

/**
 * Restore the submission result with the specified value and error.
 *
 * @example
 * ```ts
 * restoreResult(initialValue, {
 *   initialError: {
 *     formErrors: ['...'],
 *   },
 * })
 */
export function restoreResult<FormShape, ErrorShape = string[]>(
	initialValue: Record<string, FormValue>,
	options?: {
		initialError?: Partial<FormError<FormShape, ErrorShape>> | null;
	},
): SubmissionResult<
	FormShape,
	ErrorShape,
	null,
	Exclude<JsonPrimitive | FormDataEntryValue, File>
> {
	const fields: string[] = [];

	if (options?.initialError?.formErrors) {
		fields.push('');
	}

	if (options?.initialError?.fieldErrors) {
		fields.push(...Object.keys(options.initialError.fieldErrors));
	}

	return report(
		{
			value: {},
			fields,
			intent: null,
		},
		{
			value: initialValue,
			error: options?.initialError,
		},
	);
}
