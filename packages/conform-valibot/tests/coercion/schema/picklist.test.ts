import { object, picklist } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('picklist', () => {
	test('should pass only picklist values', () => {
		const schema = object({ list: picklist(['value_1', 'value_2']) });

		const formData1 = createFormData('list', 'value_1');
		const output1 = parseWithValibot(formData1, { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { list: 'value_1' },
		});

		const formData2 = createFormData('list', 'value_2');
		const output2 = parseWithValibot(formData2, { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { list: 'value_2' },
		});

		const formData3 = createFormData('list', 'value_3');
		const output3 = parseWithValibot(formData3, { schema });
		expect(output3).toMatchObject({
			error: {
				list: expect.anything(),
			},
		});
	});
});
