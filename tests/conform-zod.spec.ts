import { test, expect } from '@playwright/test';
import {
	getFieldsetConstraint,
	parse,
	ifNonEmptyString,
} from '@conform-to/zod';
import { z } from 'zod';
import { installGlobals } from '@remix-run/node';

function createFormData(entries: Array<[string, string | File]>): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

test.beforeAll(() => {
	installGlobals();
});

test.describe('conform-zod', () => {
	const schema = z
		.object({
			text: z
				.string()
				.min(1, 'min')
				.max(100, 'max')
				.regex(/^[A-Z]{1-100}$/, 'regex')
				.refine(() => false, 'refine'),
			number: z.preprocess(
				ifNonEmptyString(Number),
				z.number().min(1, 'min').max(10, 'max').step(2, 'step'),
			),
			timestamp: z.preprocess(
				ifNonEmptyString((value) => new Date(value)),
				z
					.date()
					.min(new Date(1), 'min')
					.max(new Date(), 'max')
					.default(new Date()),
			),
			flag: z.preprocess(
				ifNonEmptyString((value) => value === 'Yes'),
				z.boolean().optional(),
			),
			options: z
				.array(z.enum(['a', 'b', 'c']).refine(() => false, 'refine'))
				.min(3, 'min'),
			nested: z
				.object({
					key: z.string().refine(() => false, 'refine'),
				})
				.refine(() => false, 'refine'),
			list: z
				.array(
					z
						.object({
							key: z.string().refine(() => false, 'refine'),
						})
						.refine(() => false, 'refine'),
				)
				.max(0, 'max'),
		})
		.refine(() => false, 'refine');

	const payload = {
		text: '',
		number: '3',
		timestamp: new Date(0).toISOString(),
		flag: 'no',
		options: ['a', 'b'],
		nested: { key: '' },
		list: [{ key: '' }],
	};
	const error = {
		text: 'min',
		number: 'step',
		timestamp: 'min',
		options: 'min',
		'options[0]': 'refine',
		'options[1]': 'refine',
		'nested.key': 'refine',
		nested: 'refine',
		list: 'max',
		'list[0].key': 'refine',
		'list[0]': 'refine',
		'': 'refine',
	};

	test('getFieldsetConstraint', () => {
		const constraint = {
			text: {
				required: true,
				minLength: 1,
				maxLength: 100,
				pattern: '^[A-Z]{1-100}$',
			},
			number: {
				required: true,
				min: 1,
				max: 10,
			},
			timestamp: {
				required: false,
			},
			flag: {
				required: false,
			},
			options: {
				required: true,
				pattern: 'a|b|c',
				multiple: true,
			},
			nested: {
				required: true,
			},
			list: {
				required: true,
				multiple: true,
			},
		};

		expect(getFieldsetConstraint(schema)).toEqual(constraint);

		// Non-object schemas will be ignored
		expect(getFieldsetConstraint(z.string())).toEqual({});
		expect(getFieldsetConstraint(z.string().array())).toEqual({});

		// Intersection is supported
		expect(
			getFieldsetConstraint(
				schema.and(
					z.object({ text: z.string().optional(), something: z.string() }),
				),
			),
		).toEqual({
			...constraint,
			text: { required: false },
			something: { required: true },
		});

		// Union is supported
		expect(
			getFieldsetConstraint(
				z
					.union([
						z.object({ type: z.literal('a'), foo: z.string().min(1, 'min') }),
						z.object({ type: z.literal('b'), bar: z.string().min(1, 'min') }),
					])
					.and(
						z.object({
							baz: z.string().min(1, 'min'),
						}),
					),
			),
		).toEqual({
			type: { required: true },
			foo: { required: false, minLength: 1 },
			bar: { required: false, minLength: 1 },
			baz: { required: true, minLength: 1 },
		});

		// Discriminated union is also supported
		expect(
			getFieldsetConstraint(
				z
					.discriminatedUnion('type', [
						z.object({ type: z.literal('a'), foo: z.string().min(1, 'min') }),
						z.object({ type: z.literal('b'), bar: z.string().min(1, 'min') }),
					])
					.and(
						z.object({
							baz: z.string().min(1, 'min'),
						}),
					),
			),
		).toEqual({
			type: { required: true },
			foo: { required: false, minLength: 1 },
			bar: { required: false, minLength: 1 },
			baz: { required: true, minLength: 1 },
		});
	});

	test('parse', () => {
		const formData = createFormData([
			['text', payload.text],
			['number', payload.number],
			['timestamp', payload.timestamp],
			['flag', payload.flag],
			['options[0]', payload.options[0]],
			['options[1]', payload.options[1]],
			['nested.key', payload.nested.key],
			['list[0].key', payload.list[0].key],
		]);

		expect(parse(formData, { schema })).toEqual({
			intent: 'submit',
			payload,
			error,
		});
		expect(
			parse(formData, { schema, acceptMultipleErrors: () => false }),
		).toEqual({
			intent: 'submit',
			payload,
			error,
		});
		expect(
			parse(formData, { schema, acceptMultipleErrors: () => true }),
		).toEqual({
			intent: 'submit',
			payload,
			error: {
				...error,
				text: ['min', 'regex', 'refine'],
			},
		});
	});
});
