import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-4';
import { string, minLength, maxLength, regex, refine, lazy } from '@zod/mini';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.lazy', () => {
		test('should pass lazy', () => {
			const baseSchema = z.object({
				name: z.string({ message: 'required' }),
			});

			type Category = z.infer<typeof baseSchema> & {
				subcategories: Category[];
			};

			const category: z.ZodType<Category, Category> = baseSchema.extend({
				subcategories: z.lazy(() => category.array()),
			});

			type Node = z.infer<typeof baseSchema> & {
				left?: Node | undefined;
				right?: Node | undefined;
			};

			const node: z.ZodType<Node, Node> = baseSchema.extend({
				left: z.lazy(() => node.optional()),
				right: z.lazy(() => node.optional()),
			});

			const schema = z.object({
				category,
				node,
			});

			expect(
				getResult(
					coerceFormValue(schema).safeParse({
						category: {
							name: '',
							subcategories: [
								{
									name: '',
									subcategories: [
										{
											name: '',
										},
									],
								},
								{
									name: '',
								},
							],
						},
						node: {
							name: '',
							left: {
								name: '',
								left: {
									name: '',
								},
								right: {
									name: '',
								},
							},
							right: {
								name: '',
								right: {
									name: '',
								},
							},
						},
					}),
				),
			).toEqual({
				success: false,
				error: {
					'category.name': ['required'],
					'category.subcategories[0].name': ['required'],
					'category.subcategories[0].subcategories[0].name': ['required'],
					'category.subcategories[1].name': ['required'],
					'node.name': ['required'],
					'node.left.name': ['required'],
					'node.left.left.name': ['required'],
					'node.left.right.name': ['required'],
					'node.right.name': ['required'],
					'node.right.right.name': ['required'],
				},
			});
		});

		test('should pass lazy with mini', () => {
			const schema = lazy(() =>
				string({
					error: (ctx) => {
						if (ctx.input === undefined) {
							return 'required';
						}

						return 'invalid';
					},
				}).check(
					minLength(10, 'min'),
					maxLength(100, 'max'),
					regex(/^[A-Z]{1,100}$/, { message: 'regex' }),
					refine((value) => value !== 'error', 'refine'),
				),
			);
			const file = new File([], '');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(file))).toEqual({
				success: false,
				error: {
					'': ['invalid'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse('error'))).toEqual({
				success: false,
				error: {
					'': ['min', 'regex', 'refine'],
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse('ABCDEFGHIJ')),
			).toEqual({
				success: true,
				data: 'ABCDEFGHIJ',
			});
		});
	});
});
