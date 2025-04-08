import { bigint, object } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('bigint', () => {
	test('should pass only bigint', () => {
		const schema = object({ id: bigint() });
		const output = parseWithValibot(createFormData('id', '20'), { schema });

		expect(output).toMatchObject({ status: 'success', value: { id: 20n } });
		expect(
			parseWithValibot(createFormData('id', ''), { schema }),
		).toMatchObject({
			error: { id: expect.anything() },
		});
		expect(
			parseWithValibot(createFormData('id', 'non bigint'), { schema }),
		).toMatchObject({
			error: { id: expect.anything() },
		});
	});
});
