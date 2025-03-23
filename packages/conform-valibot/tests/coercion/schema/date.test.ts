import { date, object } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('date', () => {
	test('should pass only dates', () => {
		const schema = object({ birthday: date() });
		const output = parseWithValibot(createFormData('birthday', '2023-11-19'), {
			schema,
		});
		expect(output).toMatchObject({
			status: 'success',
			value: { birthday: new Date('2023-11-19') },
		});

		expect(
			parseWithValibot(createFormData('birthday', 'non date'), { schema }),
		).toMatchObject({
			error: {
				birthday: expect.anything(),
			},
		});
	});
});
