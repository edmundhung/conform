import {
	check,
	number,
	object,
	objectWithRest,
	optional,
	pipe,
	string,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('objectWithRest', () => {
	test('should pass only objects', () => {
		const schema1 = object({
			obj: objectWithRest({ key1: string() }, optional(number())),
		});
		const input1 = createFormData('obj.key1', 'test');
		input1.append('obj.key2', '123');
		const output1 = parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { obj: { key1: 'test', key2: 123 } },
		});

		input1.append('obj.key3', '');
		const output2 = parseWithValibot(input1, { schema: schema1 });
		expect(output2).toMatchObject({
			status: 'success',
			value: { obj: { key1: 'test', key2: 123, key3: undefined } },
		});
	});

	test('should pass objects with pipe', () => {
		const schema = object({
			obj: pipe(
				objectWithRest({ key1: string() }, optional(number())),
				// eslint-disable-next-line no-prototype-builtins
				check((v) => v.hasOwnProperty('key2'), 'key2 is required'),
			),
		});

		const input = createFormData('obj.key1', 'has key2');
		input.append('obj.key2', '123');
		const output = parseWithValibot(input, {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { obj: { key1: 'has key2', key2: 123 } },
		});

		const errorOutput = parseWithValibot(
			createFormData('obj.key1', 'not has key2'),
			{
				schema,
			},
		);
		expect(errorOutput).toMatchObject({
			error: {
				obj: expect.anything(),
			},
		});
	});
});
