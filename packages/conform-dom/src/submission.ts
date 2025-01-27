import { setValue, getPaths } from './formdata';

export type FormValue<Entry extends FormDataEntryValue = FormDataEntryValue> =
	| Entry
	| FormValue<Entry>[]
	| { [key: string]: FormValue<Entry> };

export type FormError<Schema, ErrorShape> = {
	formError: ErrorShape | null;
	fieldError: Record<string, ErrorShape>;
	'#schema'?: Schema;
};

export type Submission = {
	fields: string[];
	value: Record<string, FormValue<FormDataEntryValue>>;
	intent: string | null;
};

export type SubmissionResult<
	Schema = unknown,
	ErrorShape = unknown,
	Intent = unknown,
	FormValueType extends FormDataEntryValue = FormDataEntryValue,
> = {
	submittedValue: Record<string, FormValue<FormValueType>>;
	fields: string[];
	intent: Intent;
	value?: Record<string, FormValue<FormValueType>> | null;
	error?: FormError<Schema, ErrorShape> | null;
};

/**
 * The name to be used when submitting a form control
 */
export const DEFAULT_INTENT = '__intent__';

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
	},
): Submission {
	const { intentName = DEFAULT_INTENT } = options ?? {};
	const fields = new Set<string>();
	const submission: Submission = {
		value: {},
		fields: [],
		intent: null,
	};

	for (const [name, value] of formData.entries()) {
		if (name !== intentName) {
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
 *    fieldError: {
 *      email: ['Invalid email format'],
 *      password: ['Password is required'],
 *    },
 * })
 *
 * // Report the submission with a form error
 * report(submission, {
 *   error: {
 *     formError: ['Invalid credentials'],
 *   },
 * })
 *
 * // Reset the form
 * report(submission, {
 *   reset: true,
 * })
 * ```
 */
export function report<Schema, ErrorShape = string[], Intent = null>(
	submission: Submission,
	options: {
		error?: Partial<FormError<Schema, ErrorShape>> | null;
		value?: Record<string, FormValue<FormDataEntryValue>> | null;
		intent?: Intent;
		reset?: boolean;
		keepFile: true;
	},
): SubmissionResult<Schema, ErrorShape, Intent | null, FormDataEntryValue>;
export function report<Schema, ErrorShape = string[], Intent = null>(
	submission: Submission,
	options: {
		error?: Partial<FormError<Schema, ErrorShape>> | null;
		value?: Record<string, FormValue<FormDataEntryValue>> | null;
		intent?: Intent;
		reset?: boolean;
		keepFile?: false;
	},
): SubmissionResult<Schema, ErrorShape, Intent | null, string>;
export function report<Schema, ErrorShape = string[], Intent = null>(
	submission: Submission,
	options: {
		error?: Partial<FormError<Schema, ErrorShape>> | null;
		value?: Record<string, FormValue<FormDataEntryValue>> | null;
		intent?: Intent;
		reset?: boolean;
		keepFile?: boolean;
	},
): SubmissionResult<Schema, ErrorShape, Intent | null, FormDataEntryValue> {
	if (options.reset) {
		return {
			submittedValue: submission.value,
			fields: submission.fields,
			intent: null,
			value: null,
		};
	}

	// options.keepFile

	return {
		submittedValue: submission.value,
		value: submission.value !== options.value ? options.value : undefined,
		error:
			typeof options.error === 'undefined' || options.error === null
				? options.error
				: {
						formError: options.error.formError ?? null,
						fieldError: options.error.fieldError ?? {},
					},
		intent: options.intent ?? null,
		fields: submission.fields,
	};
}
