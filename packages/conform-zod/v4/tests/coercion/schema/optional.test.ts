import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-v4';
import {
	object,
	string,
	number,
	boolean,
	date,
	file,
	array,
	optional,
} from 'zod-v4/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.optional', () => {
		test('should pass optional', () => {
			const schema = z.object({
				a: z.string().optional(),
				b: z.number().optional(),
				c: z.boolean().optional(),
				d: z.date().optional(),
				e: z.file().optional(),
				f: z.array(z.string().optional()),
				g: z.array(z.string()).optional(),
			});
			const schemaWithMini = object({
				a: optional(string()),
				b: optional(number()),
				c: optional(boolean()),
				d: optional(date()),
				e: optional(file()),
				f: array(optional(string())),
				g: optional(array(string())),
			});
			const emptyFile = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse({}))).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
						g: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						a: '',
						b: '',
						c: '',
						d: '',
						e: emptyFile,
						f: '',
						g: '',
					}),
				),
			).toEqual({
				success: true,
				data: {
					a: undefined,
					b: undefined,
					c: undefined,
					d: undefined,
					e: undefined,
					f: [],
					g: undefined,
				},
			});

			expect(() =>
				getResult(coerceFormValue(schema).safeParse({})),
			).not.toThrow();
			expect(() =>
				getResult(coerceFormValue(schemaWithMini).safeParse({})),
			).not.toThrow();
		});
	});
});
