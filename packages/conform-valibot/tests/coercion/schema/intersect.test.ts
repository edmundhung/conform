import { check, intersect, literal, object, pipe, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('intersect', () => {
	test('should pass only intersect values', () => {
		const schema1 = object({
			intersect: intersect([string(), literal('test')]),
		});
		const input1 = createFormData('intersect', 'test');
		const output1 = parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { intersect: 'test' },
		});

		const errorInput1 = createFormData('intersect', 'foo');
		const errorOutput1 = parseWithValibot(errorInput1, { schema: schema1 });
		expect(errorOutput1).toMatchObject({
			error: {
				intersect: expect.anything(),
			},
		});
		const errorInput2 = createFormData('intersect', '');
		const errorOutput2 = parseWithValibot(errorInput2, { schema: schema1 });
		expect(errorOutput2).toMatchObject({
			error: {
				intersect: expect.anything(),
			},
		});

		const schema2 = intersect([
			object({ foo: string() }),
			object({ bar: string() }),
		]);
		const input2 = createFormData('foo', 'test');
		input2.append('bar', 'test');
		const output2 = parseWithValibot(input2, { schema: schema2 });
		expect(output2).toMatchObject({
			status: 'success',
			value: { foo: 'test', bar: 'test' },
		});
		const errorInput3 = createFormData('foo', 'test');
		const errorOutput3 = parseWithValibot(errorInput3, { schema: schema2 });
		expect(errorOutput3).toMatchObject({
			error: { bar: expect.anything() },
		});
		const errorInput4 = createFormData('bar', 'test');
		const errorOutput4 = parseWithValibot(errorInput4, { schema: schema2 });
		expect(errorOutput4).toMatchObject({
			error: { foo: expect.anything() },
		});
	});

	test('should pass only intersect values with pipe', () => {
		const schema = object({
			intersect: pipe(
				intersect([string()]),
				check((value) => value === 'test', 'intersect must be equal to test'),
			),
		});
		const input1 = createFormData('intersect', 'test');
		const output1 = parseWithValibot(input1, { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { intersect: 'test' },
		});

		const errorInput1 = createFormData('intersect', 'foo');
		const errorOutput1 = parseWithValibot(errorInput1, { schema });
		expect(errorOutput1).toMatchObject({
			error: {
				intersect: expect.anything(),
			},
		});
	});

	test('should throw only first issue', () => {
		const schema = object({
			intersect: intersect([string(), literal('test')]),
		});
		const errorInput = createFormData('intersect', '');
		const info = { abortEarly: true };
		const errorOutput = parseWithValibot(errorInput, { schema, info });
		expect(errorOutput).toMatchObject({
			error: {
				intersect: expect.anything(),
			},
		});
	});
});
