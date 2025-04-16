import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import {
	object,
	string,
	number,
	boolean,
	date,
	bigint,
	file,
	optional,
} from '@zod/mini';
import { getResult } from '../../../helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('brand', () => {
			test('should pass brand', () => {
				const schema = object({
					a: string('Required').brand(),
					b: number('Required').brand(),
					c: boolean('Required').brand(),
					d: date('Required').brand(),
					e: bigint('Required').brand(),
					f: file().brand(),
					g: optional(string()).brand(),
					h: optional(string().brand()),
				}).brand();
				const defaultFile = new File(['hello', 'world'], 'example.txt');

				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							a: '',
							b: '',
							c: '',
							d: '',
							e: '',
							f: '',
							g: '',
							h: '',
						}),
					),
				).toEqual({
					success: false,
					error: {
						a: ['Required'],
						b: ['Required'],
						c: ['Required'],
						d: ['Required'],
						e: ['Required'],
						f: ['Invalid input: expected file, received string'],
					},
				});
				expect(
					getResult(
						coerceFormValue(schema).safeParse({
							a: 'hello world',
							b: '42',
							c: 'on',
							d: '1970-01-01',
							e: '0x1fffffffffffff',
							f: defaultFile,
							g: '',
							h: '',
						}),
					),
				).toEqual({
					success: true,
					data: {
						a: 'hello world',
						b: 42,
						c: true,
						d: new Date('1970-01-01'),
						e: BigInt('0x1fffffffffffff'),
						f: defaultFile,
						g: undefined,
						h: undefined,
					},
				});
			});
		});
	});
});
