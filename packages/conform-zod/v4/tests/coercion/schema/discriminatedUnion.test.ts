import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod/v4';
import {
	discriminatedUnion,
	object,
	literal,
	number,
	boolean,
	extend,
} from 'zod/v4-mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.discriminatedUnion', () => {
		test('should pass discriminatedUnion', () => {
			const schema = z.discriminatedUnion('type', [
				z.object({
					type: z.literal('a'),
					number: z.number(),
				}),
				z.object({
					type: z.literal('b'),
					boolean: z.boolean(),
				}),
			]);
			const schemaWithMini = discriminatedUnion('type', [
				object({
					type: literal('a'),
					number: number(),
				}),
				object({
					type: literal('b'),
					boolean: boolean(),
				}),
			]);

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						type: 'a',
						number: '1',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'a',
					number: 1,
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						type: 'a',
						number: '1',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'a',
					number: 1,
				},
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						type: 'b',
						boolean: 'on',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'b',
					boolean: true,
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						type: 'b',
						boolean: 'on',
					}),
				),
			).toEqual({
				success: true,
				data: {
					type: 'b',
					boolean: true,
				},
			});

			expect(getResult(coerceFormValue(schema).safeParse({}))).toEqual({
				success: false,
				error: {
					type: ['Invalid input'],
				},
			});
			expect(getResult(coerceFormValue(schemaWithMini).safeParse({}))).toEqual({
				success: false,
				error: {
					type: ['Invalid input'],
				},
			});

			const nestedSchema = z.object({
				nest: schema,
			});
			const nestedSchemaWithMini = object({
				nest: schemaWithMini,
			});
			expect(getResult(coerceFormValue(nestedSchema).safeParse({}))).toEqual({
				success: false,
				error: {
					'nest.type': ['Invalid input'],
				},
			});
			expect(
				getResult(coerceFormValue(nestedSchemaWithMini).safeParse({})),
			).toEqual({
				success: false,
				error: {
					'nest.type': ['Invalid input'],
				},
			});
		});

		test('should pass composed discriminatedUnion', () => {
			const base = z.object({
				status: z.literal('failed'),
				message: z.string(),
			});
			const schema = z.discriminatedUnion('status', [
				z.object({ status: z.literal('success'), data: z.string() }),
				z.discriminatedUnion('code', [
					base.extend({ code: z.literal(400) }),
					base.extend({ code: z.literal(401) }),
					base.extend({ code: z.literal(500) }),
				]),
			]);

			const baseWithMini = object({
				status: literal('failed'),
				message: z.string(),
			});
			const schemaWithMini = discriminatedUnion('status', [
				object({ status: literal('success'), data: z.string() }),
				discriminatedUnion('code', [
					extend(baseWithMini, { code: literal(400) }),
					extend(baseWithMini, { code: literal(401) }),
					extend(baseWithMini, { code: literal(500) }),
				]),
			]);

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						status: 'success',
						data: 'test',
					}),
				),
			).toEqual({
				success: true,
				data: {
					status: 'success',
					data: 'test',
				},
			});
			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						status: 'failed',
						message: 'error',
						code: 400,
					}),
				),
			).toEqual({
				success: true,
				data: {
					status: 'failed',
					message: 'error',
					code: 400,
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse({ status: 'none' })),
			).toEqual({
				success: false,
				error: {
					status: ['Invalid input'],
				},
			});

			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						status: 'success',
						data: 'test',
					}),
				),
			).toEqual({
				success: true,
				data: {
					status: 'success',
					data: 'test',
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({
						status: 'failed',
						message: 'error',
						code: 400,
					}),
				),
			).toEqual({
				success: true,
				data: {
					status: 'failed',
					message: 'error',
					code: 400,
				},
			});
			expect(
				getResult(
					coerceFormValue(schemaWithMini).safeParse({ status: 'none' }),
				),
			).toEqual({
				success: false,
				error: {
					status: ['Invalid input'],
				},
			});
		});
	});
});
