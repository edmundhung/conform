import { assertType, test } from 'vitest';
import type { ValidationAttributes } from '@conform-to/dom/future';

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
