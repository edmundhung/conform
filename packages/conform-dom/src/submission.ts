import { setValue, getPaths } from './formdata';
import { stripFiles } from './util';

export type FormValue<
	Entry extends string | number | boolean | File | null =
		| string
		| number
		| boolean
		| File
		| null,
> = Entry | FormValue<Entry | null>[] | { [key: string]: FormValue<Entry> };

type WebFile = Pick<File, 'name' | 'size' | 'type' | 'lastModified'>;
type Serializable<T> = T extends File
	? WebFile
	: T extends Array<infer U>
		? Serializable<U>[]
		: T extends object
			? { [K in keyof T]: Serializable<T[K]> }
			: T;

export type FormError<FormShape, ErrorShape> = {
	formError: ErrorShape | null;
	fieldError: Record<string, ErrorShape>;
	'~type'?: Serializable<FormShape>;
};

export type Submission<Entry extends FormDataEntryValue = FormDataEntryValue> =
	{
		value: Record<string, FormValue<Entry>>;
		fields: string[];
		intent: string | null;
	};

export type SubmissionResult<
	FormShape,
	ErrorShape,
	Intent,
	Entry extends FormDataEntryValue = FormDataEntryValue,
> = {
	submission: Submission<Entry>;
	value?: Record<string, FormValue<Entry | number | boolean | null>> | null;
	error?: FormError<FormShape, ErrorShape> | null;
	intent?: Intent | null | undefined;
};

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
export function report<FormShape, ErrorShape = string[], Intent = never>(
	submission: Submission,
	options: {
		keepFile?: false;
		error?: Partial<FormError<FormShape, ErrorShape>> | null;
		value?: Record<string, FormValue> | null;
		intent?: Intent | null;
		reset?: boolean;
	},
): SubmissionResult<FormShape, ErrorShape, Intent, string>;
export function report<FormShape, ErrorShape = string[], Intent = never>(
	submission: Submission,
	options: {
		keepFile: true;
		error?: Partial<FormError<FormShape, ErrorShape>> | null;
		value?: Record<string, FormValue> | null;
		intent?: Intent | null;
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
		reset?: boolean;
	},
): SubmissionResult<FormShape, ErrorShape, Intent> {
	return {
		submission: options.keepFile
			? submission
			: {
					...submission,
					value: stripFiles(submission.value),
				},
		value: options.reset
			? null
			: !options.value || submission.value === options.value
				? undefined
				: options.keepFile
					? stripFiles(options.value)
					: options.value,
		error: !options.error
			? options.error
			: {
					formError: options.error.formError ?? null,
					fieldError: options.error.fieldError ?? {},
				},
		intent: options.intent,
	};
}
