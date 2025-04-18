import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import {
	object,
	string,
	email,
	number,
	boolean,
	date,
	file,
	array,
	nullable,
	_default,
	refine,
	gt,
	minimum,
} from '@zod/mini';
import { getResult } from '../../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('default', () => {
			test('should pass default', () => {
				const defaultFile = new File(['hello', 'world'], 'example.txt');
				const defaultDate = new Date(0);
				const schema = object({
					a: _default(string(), 'text'),
					b: _default(number(), 123),
					c: _default(boolean(), true),
					d: _default(date(), defaultDate),
					e: _default(file(), defaultFile),
					f: _default(array(string()), ['foo', 'bar']),
					g: _default(nullable(string()), null),
					h: _default(string(), ''),
				});
				const emptyFile = new File([], '');

				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							a: '',
							b: '',
							c: '',
							d: '',
							e: emptyFile,
							f: '',
						}),
					),
				).toEqual({
					success: true,
					data: {
						a: 'text',
						b: 123,
						c: true,
						d: defaultDate,
						e: defaultFile,
						f: ['foo', 'bar'],
						g: null,
						h: '',
					},
				});

				const today = new Date();
				const schema2 = object({
					a: _default(email('invalid'), ''),
					b: _default(number().check(gt(10, 'invalid')), 0),
					c: _default(
						boolean().check(refine((value) => !!value, 'invalid')),
						false,
					),
					d: _default(date().check(minimum(today, 'invalid')), defaultDate),
					e: _default(
						file().check(refine((file) => file.size > 100, 'invalid')),
						defaultFile,
					),
				});

				expect(getResult(coerceFormValue(schema2).safeParse({}))).toEqual({
					success: true,
					data: {
						a: '',
						b: 0,
						c: false,
						d: defaultDate,
						e: defaultFile,
					},
				});
			});
		});
	});
});
