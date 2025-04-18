import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../coercion';
import { z } from 'zod-4';
import { getResult } from '../../../../tests/helpers/zod';

describe('coercion', () => {
	describe('z.file', () => {
		test('should pass file', () => {
			const schema = z.file({ message: 'required' });
			const emptyFile = new File([], '');
			const txtFile = new File(['hello', 'world'], 'example.txt');

			expect(getResult(coerceFormValue(schema).safeParse(''))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(
				getResult(coerceFormValue(schema).safeParse('helloworld')),
			).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(emptyFile))).toEqual({
				success: false,
				error: {
					'': ['required'],
				},
			});
			expect(getResult(coerceFormValue(schema).safeParse(txtFile))).toEqual({
				success: true,
				data: txtFile,
			});
		});
	});
});
