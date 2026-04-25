import { assertType, test, expectTypeOf } from 'vitest';
import type {
	FieldName,
	FormError,
	FormValue,
	Submission,
	SubmissionResult,
	ValidationAttributes,
} from '../future';
import { getFieldValue, isDirty, parseSubmission, report } from '../future';

test('ValidationAttributes', () => {
	assertType<ValidationAttributes>({});
	assertType<ValidationAttributes>({
		required: true,
		minLength: 5,
		maxLength: 100,
		min: 0,
		max: '2024-12-31',
		step: 1,
		multiple: false,
		pattern: '[0-9]+',
		accept: 'image/*,video/*',
	});
	assertType<ValidationAttributes>({
		required: true,
		pattern: '[a-z]+',
	});
	assertType<ValidationAttributes>({
		min: '2024-01-01',
		max: 100,
		step: '0.5',
	});
	assertType<ValidationAttributes>({
		required: undefined,
		minLength: undefined,
		maxLength: undefined,
		min: undefined,
		max: undefined,
		step: undefined,
		multiple: undefined,
		pattern: undefined,
		accept: undefined,
	});
});

test('getFieldValue', () => {
	const formData = new FormData();

	// Without type option returns unknown
	expectTypeOf(getFieldValue(formData, 'field')).toEqualTypeOf<unknown>();

	// Array without type returns Array<unknown>
	expectTypeOf(getFieldValue(formData, 'tags', { array: true })).toEqualTypeOf<
		Array<unknown>
	>();

	// String type
	expectTypeOf(
		getFieldValue(formData, 'name', { type: 'string' }),
	).toEqualTypeOf<string>();
	expectTypeOf(
		getFieldValue(formData, 'names', { type: 'string', array: true }),
	).toEqualTypeOf<string[]>();

	// File type
	expectTypeOf(
		getFieldValue(formData, 'avatar', { type: 'file' }),
	).toEqualTypeOf<File>();
	expectTypeOf(
		getFieldValue(formData, 'files', { type: 'file', array: true }),
	).toEqualTypeOf<File[]>();

	// Object type - FieldName inference (no explicit generic needed)
	expectTypeOf(
		getFieldValue(
			formData,
			'address' as FieldName<{ city: string; zipcode: number }>,
			{ type: 'object' },
		),
	).toEqualTypeOf<{ city: unknown; zipcode: unknown }>();

	// Object array - FieldName infers array element shape
	expectTypeOf(
		getFieldValue(
			formData,
			'items' as FieldName<Array<{ name: string; count: number }>>,
			{ type: 'object', array: true },
		),
	).toEqualTypeOf<Array<{ name: unknown; count: unknown }>>();

	// Generic Record<string, any>
	expectTypeOf(
		getFieldValue<Record<string, any>>(formData, 'data', { type: 'object' }),
	).toEqualTypeOf<Record<string, unknown>>();

	// Nested objects flatten to first level keys
	expectTypeOf(
		getFieldValue<{ profile: { name: string }; settings: { theme: string } }>(
			formData,
			'user',
			{ type: 'object' },
		),
	).toEqualTypeOf<{ profile: unknown; settings: unknown }>();

	// Discriminated unions flatten all properties
	expectTypeOf(
		getFieldValue<
			| { type: 'text'; value: string }
			| { type: 'number'; value: number }
			| { type: 'file'; file: File }
		>(formData, 'field', { type: 'object' }),
	).toEqualTypeOf<{ type: unknown; value: unknown; file: unknown }>();

	// Optional - adds undefined to return type
	expectTypeOf(
		getFieldValue(formData, 'field', { optional: true }),
	).toEqualTypeOf<unknown>();

	expectTypeOf(
		getFieldValue(formData, 'name', { type: 'string', optional: true }),
	).toEqualTypeOf<string | undefined>();

	expectTypeOf(
		getFieldValue(formData, 'avatar', { type: 'file', optional: true }),
	).toEqualTypeOf<File | undefined>();

	expectTypeOf(
		getFieldValue(formData, 'tags', { array: true, optional: true }),
	).toEqualTypeOf<Array<unknown> | undefined>();

	expectTypeOf(
		getFieldValue(
			formData,
			'address' as FieldName<{ city: string; zipcode: number }>,
			{ type: 'object', optional: true },
		),
	).toEqualTypeOf<{ city: unknown; zipcode: unknown } | undefined>();

	expectTypeOf(
		getFieldValue(formData, 'names', {
			type: 'string',
			array: true,
			optional: true,
		}),
	).toEqualTypeOf<string[] | undefined>();
});

test('parseSubmission', () => {
	expectTypeOf(
		parseSubmission(new FormData(), {
			intentName: undefined,
			skipEntry: undefined,
			stripEmptyValues: undefined,
		}),
	).toEqualTypeOf<Submission>();
});

test('isDirty', () => {
	expectTypeOf(
		isDirty(new FormData(), {
			defaultValue: undefined,
			intentName: undefined,
			serialize: undefined,
			skipEntry: undefined,
		}),
	).toEqualTypeOf<boolean | undefined>();
});

const submission = {
	payload: {
		lorem: '',
		file: new File(['content'], 'test.txt'),
	},
	fields: ['lorem', 'file'],
	intent: null,
};

const updatedValue = {
	lorem: 'ipsum',
	file: new File(['updated'], 'updated.txt'),
};

test('report', () => {
	/** Default behavior strips files from the submission payload and target value. */
	const defaultResult = report(submission);
	const explicitStripResult = report(submission, { keepFiles: false });
	const defaultResultWithValue = report(submission, { value: updatedValue });

	expectTypeOf(defaultResult).toEqualTypeOf<
		SubmissionResult<never, string | number | boolean | null>
	>();
	expectTypeOf(explicitStripResult).toEqualTypeOf<
		SubmissionResult<never, string | number | boolean | null>
	>();
	expectTypeOf(defaultResult.submission.payload.file).toEqualTypeOf<
		FormValue<string | number | boolean | null> | undefined
	>();
	expectTypeOf(defaultResultWithValue.targetValue).toEqualTypeOf<
		Record<string, FormValue<string | number | boolean | null>> | undefined
	>();

	/** `keepFiles: true` preserves file values in both payload and target value. */
	const keepFilesResult = report(submission, {
		keepFiles: true,
		value: updatedValue,
	});

	expectTypeOf(keepFilesResult).toEqualTypeOf<SubmissionResult<never>>();
	expectTypeOf(keepFilesResult.submission.payload.file).toEqualTypeOf<
		FormValue<string | number | boolean | File | null> | undefined
	>();
	expectTypeOf(keepFilesResult.targetValue).toEqualTypeOf<
		| Record<string, FormValue<string | number | boolean | File | null>>
		| undefined
	>();

	/** Literal `null` should keep the dedicated `SubmissionResult<never>` overload. */
	expectTypeOf(report(submission, { error: null })).toEqualTypeOf<
		SubmissionResult<never, string | number | boolean | null>
	>();
	expectTypeOf(
		report(submission, { keepFiles: true, error: null }),
	).toEqualTypeOf<SubmissionResult<never>>();

	/** Custom errors should infer the provided error shape. */
	const stringResult = report(submission, {
		error: {
			fieldErrors: {
				lorem: 'Required',
			},
		},
	});
	const objectResult = report(submission, {
		keepFiles: true,
		error: {
			formErrors: { message: 'Invalid' },
			fieldErrors: {
				lorem: { message: 'Required' },
			},
		},
	});

	expectTypeOf(stringResult).toEqualTypeOf<
		SubmissionResult<string, string | number | boolean | null>
	>();
	expectTypeOf(objectResult).toEqualTypeOf<
		SubmissionResult<{ message: string }>
	>();

	/** Standard schema issues should normalize to `string[]` errors. */
	const standardSchemaResult = report(submission, {
		error: {
			issues: [{ path: ['lorem'], message: 'Required' }],
		},
	});

	expectTypeOf(standardSchemaResult).toEqualTypeOf<
		SubmissionResult<string[], string | number | boolean | null>
	>();

	/** Nullable normalized form errors should still use the file-stripping overloads. */
	const error: FormError<string[]> | null =
		Math.random() > 0.5
			? {
					formErrors: null,
					fieldErrors: {
						lorem: ['Required'],
					},
				}
			: null;
	expectTypeOf(report(submission, { error })).toEqualTypeOf<
		SubmissionResult<string[], string | number | boolean | null>
	>();
	expectTypeOf(
		report(submission, {
			keepFiles: true,
			error,
		}),
	).toEqualTypeOf<SubmissionResult<string[]>>();
});
