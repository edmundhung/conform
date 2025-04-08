import { any, object } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('any', () => {
	test('should pass any values', () => {
		const schema = object({ item: any() });
		const input1 = createFormData('item', 'hello');
		const output1 = parseWithValibot(input1, { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { item: 'hello' },
		});
		const input2 = createFormData('item', '1');
		input2.append('item', '2');
		const output2 = parseWithValibot(input2, { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { item: ['1', '2'] },
		});
	});
});
