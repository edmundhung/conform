import {
	checkAsync,
	forwardAsync,
	literal,
	number,
	object,
	pipeAsync,
	string,
	variantAsync,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('variantAsync', () => {
	test('should pass only variant values', async () => {
		const schema1 = variantAsync('type', [
			object({ type: literal('a'), a: string() }),
			object({ type: literal('b'), b: number() }),
		]);
		const input1 = createFormData('type', 'a');
		input1.append('a', 'hello');
		const output1 = await parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({
			status: 'success',
			value: { type: 'a', a: 'hello' },
		});
		const input2 = createFormData('type', 'b');
		input2.append('b', '123');
		const output2 = await parseWithValibot(input2, { schema: schema1 });
		expect(output2).toMatchObject({
			status: 'success',
			value: { type: 'b', b: 123 },
		});

		const schema2 = variantAsync('type', [
			schema1,
			object({ type: literal('c'), foo: literal('foo') }),
			object({ type: literal('c'), bar: literal('bar') }),
		]);
		const input3 = createFormData('type', 'b');
		input3.append('b', '123');
		const output3 = await parseWithValibot(input3, { schema: schema2 });
		expect(output3).toMatchObject({
			status: 'success',
			value: { type: 'b', b: 123 },
		});
		const input4 = createFormData('type', 'c');
		input4.append('foo', 'foo');
		const output4 = await parseWithValibot(input4, { schema: schema2 });
		expect(output4).toMatchObject({
			status: 'success',
			value: { type: 'c', foo: 'foo' },
		});
		const input5 = createFormData('type', 'c');
		input5.append('bar', 'bar');
		const output5 = await parseWithValibot(input5, { schema: schema2 });
		expect(output5).toMatchObject({
			status: 'success',
			value: { type: 'c', bar: 'bar' },
		});

		const errorInput1 = createFormData('type', 'x');
		expect(
			await parseWithValibot(errorInput1, { schema: schema2 }),
		).toMatchObject({
			error: { type: expect.anything() },
		});
		const errorInput2 = createFormData('type2', 'a');
		expect(
			await parseWithValibot(errorInput2, { schema: schema2 }),
		).toMatchObject({
			error: {
				type: expect.anything(),
			},
		});
	});

	test('should pass only variant values with pipe', async () => {
		const schema = pipeAsync(
			variantAsync('type', [
				object({ type: literal('a'), a: string() }),
				object({ type: literal('b'), b: number() }),
			]),
			forwardAsync(
				checkAsync(
					async ({ type, ...other }) =>
						type === 'a' || (type === 'b' && 'b' in other && other.b !== 0),
					'b must be non-zero',
				),
				['b'],
			),
		);
		const input1 = createFormData('type', 'a');
		input1.append('a', 'hello');
		const output1 = await parseWithValibot(input1, { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { type: 'a', a: 'hello' },
		});
		const input2 = createFormData('type', 'b');
		input2.append('b', '123');
		const output2 = await parseWithValibot(input2, { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { type: 'b', b: 123 },
		});

		const errorInput1 = createFormData('type', 'b');
		errorInput1.append('b', '0');
		const errorOutput1 = await parseWithValibot(errorInput1, { schema });
		expect(errorOutput1).toMatchObject({
			error: { b: expect.anything() },
		});
	});
});
