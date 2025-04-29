import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.lazy', () => {
		test('should pass lazy', () => {
			const baseSchema = z.object({
				name: z.string({ required_error: 'required' }),
			});

			type Category = z.infer<typeof baseSchema> & {
				subcategories: Category[];
			};

			const category: z.ZodType<Category> = baseSchema.extend({
				subcategories: z.lazy(() => category.array()),
			});

			type Node = z.infer<typeof baseSchema> & {
				left?: Node | undefined;
				right?: Node | undefined;
			};

			const node: z.ZodType<Node> = baseSchema.extend({
				left: z.lazy(() => node).optional(),
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
	});
});
