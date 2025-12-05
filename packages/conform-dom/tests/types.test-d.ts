import { assertType, test, expectTypeOf } from 'vitest';
import type { FieldName, ValidationAttributes } from '@conform-to/dom/future';
import { getFieldValue } from '@conform-to/dom/future';

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
});
