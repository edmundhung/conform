import { test, expect } from '@playwright/test';
import { parse, getFieldsetConstraint } from '@conform-to/typebox';
import { Type } from '@sinclair/typebox';
import {
	SetErrorFunction,
	DefaultErrorFunction,
	ValueErrorType,
} from '@sinclair/typebox/errors';

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

SetErrorFunction((error) => {
	switch (error.errorType) {
		case ValueErrorType.ArrayMinItems:
		case ValueErrorType.DateMinimumTimestamp:
		case ValueErrorType.NumberMinimum:
		case ValueErrorType.StringMinLength:
			return 'min';
		case ValueErrorType.ArrayMaxItems:
		case ValueErrorType.DateMaximumTimestamp:
		case ValueErrorType.NumberMaximum:
		case ValueErrorType.ObjectMaxProperties:
			return 'max';
		case ValueErrorType.NumberMultipleOf:
			return 'step';
		case ValueErrorType.StringPattern:
			return 'regex';
		case ValueErrorType.Union:
			return 'invalid';
		default:
			return DefaultErrorFunction(error);
	}
});

test.describe('conform-typebox', () => {
	const schema = Type.Object(
		{
			text: Type.Optional(
				Type.String({
					minLength: 1,
					maxLength: 100,
					pattern: '^[A-Z]{1-100}$',
				}),
			),
			tag: Type.Union([
				Type.Literal('x'),
				Type.Literal('y'),
				Type.Literal('z'),
			]),
			number: Type.Number({ minimum: 1, maximum: 10, multipleOf: 2 }),
			timestamp: Type.Optional(
				Type.Date({
					minimumTimestamp: new Date(1).getTime(),
					maximumTimestamp: new Date().getTime(),
					default: new Date().getTime(),
				}),
			),
			options: Type.Optional(
				Type.Array(
					Type.Union([Type.Literal('a'), Type.Literal('b'), Type.Literal('c')]),
					{
						minItems: 3,
					},
				),
			),
			nested: Type.Optional(
				Type.Object({
					key: Type.String({ minLength: 1 }),
				}),
			),
			list: Type.Optional(
				Type.Array(
					Type.Object({
						key: Type.String({ minLength: 1 }),
					}),
					{ maxItems: 0 },
				),
			),
		},
		{ maxProperties: 0 },
	);

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
		tag: ['invalid'],
		number: ['max', 'step'],
		timestamp: ['min'],
		'options[1]': ['invalid'],
		options: ['min'],
		'nested.key': ['min'],
		'list[0].key': ['min'],
		list: ['max'],
		'': ['max'],
	};

	test('getFieldsetConstraint', () => {
		expect(getFieldsetConstraint(schema)).toEqual({
			text: {
				minLength: 1,
				maxLength: 100,
				pattern: '^[A-Z]{1-100}$',
				required: false,
			},
			tag: {
				required: true,
				pattern: 'x|y|z',
			},
			number: {
				required: true,
				step: 2,
				min: 1,
				max: 10,
			},
			timestamp: {
				required: false,
			},
			options: {
				multiple: true,
				pattern: 'a|b|c',
				required: false,
			},
			nested: {
				required: false,
			},
			list: {
				multiple: true,
				required: false,
			},
		});
	});

	test('parse', () => {
		const formData = createFormData([
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
			intent: 'submit',
			payload,
			error,
		});
	});
});
