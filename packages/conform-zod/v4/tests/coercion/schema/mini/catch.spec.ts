import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import {
	object,
	string,
	number,
	boolean,
	date,
	file,
	array,
	minLength,
	catch as catch_,
} from '@zod/mini';
import { getResult } from '../../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('catch', () => {
			test('should pass catch', () => {
				const defaultFile = new File(['hello', 'world'], 'example.txt');
				const userFile = new File(['foo', 'bar'], 'foobar.txt');
				const defaultDate = new Date(0);
				const userDate = new Date(1);
				const schema = object({
					a: catch_(string(), 'text'),
					b: catch_(number(), 123),
					c: catch_(boolean(), true),
					d: catch_(date(), defaultDate),
					e: catch_(file(), defaultFile),
					f: catch_(array(string()).check(minLength(1)), ['foo', 'bar']),
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
					},
				});

				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							a: 'othertext',
							b: '456',
							c: 'on',
							d: userDate.toISOString(),
							e: userFile,
							f: ['hello', 'world'],
						}),
					),
				).toEqual({
					success: true,
					data: {
						a: 'othertext',
						b: 456,
						c: true,
						d: userDate,
						e: userFile,
						f: ['hello', 'world'],
					},
				});
			});
		});
	});
});
