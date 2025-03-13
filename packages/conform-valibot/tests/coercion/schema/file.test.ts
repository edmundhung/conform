import { file, mimeType, object, pipe } from 'valibot';
import { describe, expect, test } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe('file', () => {
	test('should pass only file', () => {
		const schema = object({ file: file() });

		const output = parseWithValibot(
			createFormData('file', new File(['foo'], 'foo.pn')),
			{
				schema,
			},
		);

		expect(output).toMatchObject({
			status: 'success',
		});
		expect(
			parseWithValibot(createFormData('name', ''), { schema }),
		).toMatchObject({
			error: { file: expect.anything() },
		});
	});

	test('should pass file with pipe', () => {
		const schema = object({
			file: pipe(file(), mimeType(['image/jpeg', 'image/png'])),
		});

		const output = parseWithValibot(
			createFormData(
				'file',
				new File(['foo'], 'foo.jpeg', { type: 'image/jpeg' }),
			),
			{ schema },
		);

		expect(output).toMatchObject({
			status: 'success',
		});
		expect(
			parseWithValibot(
				createFormData(
					'file',
					new File(['foo'], 'foo.gif', { type: 'image/gif' }),
				),
				{ schema },
			),
		).toMatchObject({
			error: {
				file: expect.anything(),
			},
		});
	});
});
