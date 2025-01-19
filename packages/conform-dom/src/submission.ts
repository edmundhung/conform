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

export type Submission<
	Intent = string | null,
	Schema = unknown,
	ErrorShape = unknown,
	FormValueType extends FormDataEntryValue = FormDataEntryValue,
> = {
	fields: string[];
	value: Record<string, FormValue<FormValueType>> | null;
	intent: Intent;
	error?: FormError<Schema, ErrorShape> | null;
};

export type Fallback<MainType, FallbackType> = unknown extends MainType
	? FallbackType
	: MainType;

export type SubmissionSchema<SubmissionType> =
	SubmissionType extends Submission<any, infer Schema, any, any>
		? Schema
		: unknown;

export type SubmissionErrorShape<SubmissionType> =
	SubmissionType extends Submission<any, any, infer ErrorShape, any>
		? ErrorShape
		: unknown;

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
		intentName: string;
	},
): Submission<string | null> {
	const { intentName = DEFAULT_INTENT } = options ?? {};
	const initialValue: Record<string, any> = {};
	const fields = new Set<string>();

	for (const [name, value] of formData.entries()) {
		if (name !== intentName) {
			setValue(initialValue, getPaths(name), (currentValue: unknown) => {
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

	const submission: Submission<string | null> = {
		value: initialValue,
		fields: Array.from(fields),
		intent: null,
	};

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
export function report<
	SubmissionType extends Submission<any, any, any>,
	Schema,
	ErrorShape = string[],
>(
	submission: SubmissionType,
	options: {
		error?: Partial<
			FormError<
				Fallback<SubmissionSchema<SubmissionType>, Schema>,
				Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>
			>
		> | null;
		reset?: boolean;
		keepFile: true;
	},
): Submission<
	| (SubmissionType extends Submission<infer Intent, any, any>
			? Intent
			: unknown)
	| null,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	SubmissionType extends Submission<any, any, any, infer FormValueType>
		? FormValueType
		: FormDataEntryValue
>;
export function report<
	SubmissionType extends Submission<any, any, any>,
	Schema,
	ErrorShape = string[],
>(
	submission: SubmissionType,
	options: {
		error?: Partial<
			FormError<
				Fallback<SubmissionSchema<SubmissionType>, Schema>,
				Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>
			>
		> | null;
		reset?: boolean;
		keepFile?: false;
	},
): Submission<
	| (SubmissionType extends Submission<infer Intent, any, any>
			? Intent
			: unknown)
	| null,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	string
>;
export function report<
	SubmissionType extends Submission<any, any, any>,
	Schema,
	ErrorShape = string[],
>(
	submission: SubmissionType,
	options: {
		error?: Partial<
			FormError<
				Fallback<SubmissionSchema<SubmissionType>, Schema>,
				Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>
			>
		> | null;
		reset?: boolean;
		keepFile?: boolean;
	},
): Submission<
	| (SubmissionType extends Submission<infer Intent, any, any>
			? Intent
			: unknown)
	| null,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	SubmissionType extends Submission<any, any, any, infer FormValueType>
		? FormValueType
		: FormDataEntryValue
> {
	if (options.reset) {
		return {
			value: null,
			fields: [],
			intent: null,
		};
	}

	return {
		// @ts-expect-error TODO: remove all files from submission.value
		value: options.keepFile ? submission.value : submission.value,
		error:
			typeof options.error === 'undefined'
				? submission.error
				: options.error === null
					? null
					: {
							formError: options.error.formError ?? null,
							fieldError: options.error.fieldError ?? {},
						},
		fields: submission.fields,
		intent: submission.intent,
	};
}
