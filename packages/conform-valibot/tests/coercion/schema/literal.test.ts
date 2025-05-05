import { object, literal } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('literal', () => {
	test('should pass only literals', () => {
		const schema = object({ name: literal('Jane') });

		const output = parseWithValibot(createFormData('name', 'Jane'), { schema });

		expect(output).toMatchObject({
			status: 'success',
			value: { name: 'Jane' },
		});
		expect(
			parseWithValibot(createFormData('name', ''), { schema }),
		).toMatchObject({
			error: { name: expect.anything() },
		});

		const numberSchema = object({ age: literal(0) });
		const numberOutput = parseWithValibot(createFormData('age', '0'), {
			schema: numberSchema,
		});
		expect(numberOutput).toMatchObject({
			status: 'success',
			value: { age: 0 },
		});
		expect(
			parseWithValibot(createFormData('age', '1'), { schema: numberSchema }),
		).toMatchObject({
			error: { age: expect.anything() },
		});

		const booleanSchema = object({ check: literal(true) });
		const booleanOutput = parseWithValibot(createFormData('check', 'on'), {
			schema: booleanSchema,
		});
		expect(booleanOutput).toMatchObject({
			status: 'success',
			value: { check: true },
		});
		expect(
			parseWithValibot(createFormData('check', ''), { schema: booleanSchema }),
		).toMatchObject({
			error: { check: expect.anything() },
		});

		const bigintSchema = object({ big: literal(BigInt(0)) });
		const bigintOutput = parseWithValibot(createFormData('big', '0'), {
			schema: bigintSchema,
		});
		expect(bigintOutput).toMatchObject({
			status: 'success',
			value: { big: BigInt(0) },
		});
		expect(
			parseWithValibot(createFormData('big', '1'), { schema: bigintSchema }),
		).toMatchObject({
			error: { big: expect.anything() },
		});
	});
});
