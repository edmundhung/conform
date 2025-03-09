import {
	check,
	nonOptional,
	number,
	object,
	optional,
	pipe,
	undefined_,
	union,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('nonOptional', () => {
	test('should not pass undefined', () => {
		const schema1 = object({
			item: nonOptional(optional(number())),
		});
		const input1 = createFormData('item', '1');
		const output1 = parseWithValibot(input1, { schema: schema1 });
		expect(output1).toMatchObject({ status: 'success', value: { item: 1 } });
		expect(
			parseWithValibot(createFormData('item', 'non Number'), {
				schema: schema1,
			}),
		).toMatchObject({
			error: { item: expect.anything() },
		});
		expect(
			parseWithValibot(createFormData('item2', 'non Param'), {
				schema: schema1,
			}),
		).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});

		const schema2 = object({
			item: nonOptional(union([number(), undefined_()])),
		});
		const output2 = parseWithValibot(input1, { schema: schema2 });
		expect(output2).toMatchObject({ status: 'success', value: { item: 1 } });
		expect(
			parseWithValibot(createFormData('item', 'non Number'), {
				schema: schema2,
			}),
		).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});
		expect(
			parseWithValibot(createFormData('item2', 'non Param'), {
				schema: schema2,
			}),
		).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});
	});

	test('should pass nonOptional with pipe', () => {
		const schema = object({
			age: pipe(
				nonOptional(optional(number())),
				check((value) => value > 0, 'age must be greater than 0'),
			),
		});

		const output1 = parseWithValibot(createFormData('age', '1'), { schema });
		expect(output1).toMatchObject({ status: 'success', value: { age: 1 } });

		const output2 = parseWithValibot(createFormData('age', '0'), { schema });
		expect(output2).toMatchObject({
			error: { age: expect.anything() },
		});

		const output3 = parseWithValibot(createFormData('age', ''), { schema });
		expect(output3).toMatchObject({
			error: {
				age: expect.anything(),
			},
		});
	});
});
