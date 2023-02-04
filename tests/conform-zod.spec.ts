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

	const value = {
		text: '',
		number: '3',
		timestamp: new Date(0).toISOString(),
		flag: 'no',
		options: ['a', 'b'],
		nested: { key: '' },
		list: [{ key: '' }],
	};
	const error = [
		['text', 'min'],
		['text', 'regex'],
		['text', 'refine'],
		['number', 'step'],
		['timestamp', 'min'],
		['options', 'min'],
		['options[0]', 'refine'],
		['options[1]', 'refine'],
		['nested.key', 'refine'],
		['nested', 'refine'],
		['list', 'max'],
		['list[0].key', 'refine'],
		['list[0]', 'refine'],
		['', 'refine'],
	];

	test('getFieldsetConstraint', () => {
		expect(getFieldsetConstraint(schema)).toEqual({
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
		});
	});

	test('validate', () => {
		const formData = createFormData([
			['text', value.text],
			['number', value.number],
			['timestamp', value.timestamp],
			['flag', value.flag],
			['options[0]', value.options[0]],
			['options[1]', value.options[1]],
			['nested.key', value.nested.key],
			['list[0].key', value.list[0].key],
		]);
		const submission = parse(formData, { schema });

		expect(submission.value).toEqual(value);
		expect(submission.error).toEqual(error);
		expect(submission.data).not.toBeDefined();
	});
});
