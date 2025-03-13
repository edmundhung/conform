import { blob, mimeType, object, pipe } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('blob', () => {
	test('should pass only blob', () => {
		const schema = object({ file: blob() });

		const output = parseWithValibot(createFormData('file', new Blob(['foo'])), {
			schema,
		});

		expect(output).toMatchObject({
			status: 'success',
		});
		expect(
			parseWithValibot(createFormData('name', ''), { schema }),
		).toMatchObject({
			error: { file: expect.anything() },
		});
	});

	test('should pass blob with pipe', () => {
		const schema = object({
			file: pipe(blob(), mimeType(['image/jpeg', 'image/png'])),
		});

		const output = parseWithValibot(
			createFormData('file', new Blob(['foo'], { type: 'image/jpeg' })),
			{ schema },
		);

		expect(output).toMatchObject({
			status: 'success',
		});
		expect(
			parseWithValibot(
				createFormData('file', new Blob(['foo'], { type: 'image/gif' })),
				{ schema },
			),
		).toMatchObject({
			error: {
				file: expect.anything(),
			},
		});
	});
});
