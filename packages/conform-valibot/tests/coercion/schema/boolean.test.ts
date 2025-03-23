import { boolean, object } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('boolean', () => {
	test('should pass only booleans', () => {
		const schema = object({ check: boolean() });
		const input1 = createFormData('check', 'on');
		const output1 = parseWithValibot(input1, { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { check: true },
		});
		expect(
			parseWithValibot(createFormData('check', ''), { schema }),
		).toMatchObject({
			error: {
				check: expect.anything(),
			},
		});
	});
});
