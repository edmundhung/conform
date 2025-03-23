import { object, string } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('string', () => {
	test('should pass only strings', () => {
		const schema = object({ name: string() });

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
	});
});
