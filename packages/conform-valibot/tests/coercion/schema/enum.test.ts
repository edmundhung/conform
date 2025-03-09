import { enum_, object } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

enum Direction {
	Left = 'left',
	Right = 'right',
}

describe('enum_', () => {
	test('should pass only enum values', () => {
		const schema = object({ item: enum_(Direction) });

		const formData1 = createFormData('item', Direction.Left);
		const output1 = parseWithValibot(formData1, { schema });
		expect(output1).toMatchObject({
			status: 'success',
			value: { item: Direction.Left },
		});

		const formData2 = createFormData('item', Direction.Right);
		const output2 = parseWithValibot(formData2, { schema });
		expect(output2).toMatchObject({
			status: 'success',
			value: { item: Direction.Right },
		});

		const formData3 = createFormData('item', 'value_3');
		const output3 = parseWithValibot(formData3, { schema });
		expect(output3).toMatchObject({
			error: {
				item: expect.anything(),
			},
		});
	});
});
