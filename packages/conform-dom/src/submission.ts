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
		keepFile: true;
	},
): Submission<
	SubmissionType extends Submission<infer Intent, any, any> ? Intent : unknown,
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
		keepFile?: false;
	},
): Submission<
	SubmissionType extends Submission<infer Intent, any, any> ? Intent : unknown,
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
		keepFile?: boolean;
	},
): Submission<
	SubmissionType extends Submission<infer Intent, any, any> ? Intent : unknown,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	SubmissionType extends Submission<any, any, any, infer FormValueType>
		? FormValueType
		: FormDataEntryValue
> {
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
