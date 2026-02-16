import {
	type GenericSchema,
	array,
	lazy,
	literal,
	number,
	object,
	optional,
	string,
	variant,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('lazy', () => {
	test('should coerce recursive schema', () => {
		type Category = {
			name: string;
			subcategories?: Category[];
		};

		const categorySchema: GenericSchema<Category> = object({
			name: string(),
			subcategories: optional(array(lazy(() => categorySchema))),
		});

		const schema = object({
			root: categorySchema,
		});

		const formData = new FormData();
		formData.append('root.name', 'Root');
		formData.append('root.subcategories[0].name', 'Child');

		const output = parseWithValibot(formData, { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: {
				root: {
					name: 'Root',
					subcategories: [
						{
							name: 'Child',
						},
					],
				},
			},
		});
	});

	test('should coerce fields inside lazy schema', () => {
		type Node = {
			value: number;
			children?: Node[];
		};

		const nodeSchema: GenericSchema<Node> = object({
			value: number(),
			children: optional(array(lazy(() => nodeSchema))),
		});

		const schema = object({
			tree: nodeSchema,
		});

		const formData = new FormData();
		formData.append('tree.value', '42');
		formData.append('tree.children[0].value', '10');

		const output = parseWithValibot(formData, { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: {
				tree: {
					value: 42,
					children: [
						{
							value: 10,
						},
					],
				},
			},
		});
	});

	test('should coerce recursive schema with variant', () => {
		type Condition =
			| { type: 'filter'; field: string }
			| { type: 'group'; conditions: Condition[] };

		const conditionSchema: GenericSchema<Condition> = variant('type', [
			object({
				type: literal('filter'),
				field: string(),
			}),
			object({
				type: literal('group'),
				conditions: array(lazy(() => conditionSchema)),
			}),
		]);

		const schema = object({
			condition: conditionSchema,
		});

		const formData = new FormData();
		formData.append('condition.type', 'group');
		formData.append('condition.conditions[0].type', 'filter');
		formData.append('condition.conditions[0].field', 'name');

		const output = parseWithValibot(formData, { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: {
				condition: {
					type: 'group',
					conditions: [
						{
							type: 'filter',
							field: 'name',
						},
					],
				},
			},
		});
	});

	test('should coerce optional lazy schema', () => {
		type Node = {
			value: string;
			next?: Node;
		};

		const nodeSchema: GenericSchema<Node> = object({
			value: string(),
			next: optional(lazy(() => nodeSchema)),
		});

		const schema = object({
			head: nodeSchema,
		});

		// Without the optional next field
		const formData = createFormData('head.value', 'first');

		const output = parseWithValibot(formData, { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: {
				head: {
					value: 'first',
				},
			},
		});
	});
});
