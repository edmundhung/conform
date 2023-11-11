import { test, expect } from '@playwright/test';
import { parse, getFieldsetConstraint } from '@conform-to/yup';
import * as yup from 'yup';
import { installGlobals } from '@remix-run/node';
import { STATE } from '@conform-to/dom';

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

test.describe('conform-yup', () => {
	const schema = yup
		.object({
			text: yup
				.string()
				.min(1, 'min')
				.max(100, 'max')
				.matches(/^[A-Z]{1-100}$/, 'regex'),
			tag: yup.string().required('required').oneOf(['x', 'y', 'z'], 'invalid'),
			number: yup.number().required().min(1, 'min').max(10, 'max'),
			timestamp: yup
				.date()
				.min(new Date(1), 'min')
				.max(new Date(), 'max')
				.default(new Date()),
			options: yup
				.array(yup.string().oneOf(['a', 'b', 'c'], 'invalid'))
				.min(3, 'min'),
			nested: yup
				.object({
					key: yup.string().required('required'),
				})
				.test('nested', 'error', () => false),
			list: yup
				.array(
					yup
						.object({
							key: yup.string().required('required'),
						})
						.test('list-object', 'error', () => false),
				)
				.max(0, 'max'),
		})
		.test('root', 'error', () => false);

	const payload = {
		text: '',
		tag: '',
		number: '99',
		timestamp: new Date(0).toISOString(),
		options: ['a', 'd'],
		nested: { key: '' },
		list: [{ key: '' }],
	};
	const error = {
		text: ['min', 'regex'],
		tag: ['required', 'invalid'],
		number: ['max'],
		timestamp: ['min'],
		'options[1]': ['invalid'],
		options: ['min'],
		'nested.key': ['required'],
		nested: ['error'],
		'list[0].key': ['required'],
		'list[0]': ['error'],
		list: ['max'],
		'': ['error'],
	};

	test('getFieldsetConstraint', () => {
		expect(getFieldsetConstraint(schema)).toEqual({
			text: {
				minLength: 1,
				maxLength: 100,
				pattern: '^[A-Z]{1-100}$',
			},
			tag: {
				required: true,
				pattern: 'x|y|z',
			},
			number: {
				required: true,
				min: 1,
				max: 10,
			},
			timestamp: {},
			options: {},
			nested: {},
			list: {},
		});
	});

	test('parse', () => {
		const formData = createFormData([
			[STATE, JSON.stringify({ validated: {}, key: {} })],
			['text', payload.text],
			['tag', payload.tag],
			['number', payload.number],
			['timestamp', payload.timestamp],
			['options[0]', payload.options[0]],
			['options[1]', payload.options[1]],
			['nested.key', payload.nested.key],
			['list[0].key', payload.list[0].key],
		]);

		expect(parse(formData, { schema })).toEqual({
			type: 'submit',
			payload,
			error,
			value: null,
			accept: expect.any(Function),
			reject: expect.any(Function),
		});
	});
});
