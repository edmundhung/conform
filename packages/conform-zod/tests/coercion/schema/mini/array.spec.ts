import { describe, test, expect } from 'vitest';
import { coerceFormValue } from '../../../../coercion';
import {
	string,
	array,
	minLength,
	maxLength,
	file,
	type ZodMiniType,
} from '@zod/mini';
import { getResult } from '../../../helpers/zod';

describe('coercion', () => {
	describe('mini', () => {
		describe('array', () => {
			test('should pass array', () => {
				const createSchema = (
					element: ZodMiniType = string({
						error: (ctx) => {
							if (ctx.input === undefined) {
								return 'required';
							}
							return 'invalid';
						},
					}),
				) =>
					array(element, {
						message: 'required',
					}).check(minLength(1, 'min'), maxLength(1, 'max'));

				// Scenario: Multiple select (default option is empty string)
				expect(
					getResult(coerceFormValue(createSchema()).safeParse('')),
				).toEqual({
					success: false,
					error: {
						'': ['min'],
					},
				});
				// Scenario: Checkbox group (Checked only one item)
				expect(
					getResult(coerceFormValue(createSchema()).safeParse('a')),
				).toEqual({
					success: true,
					data: ['a'],
				});
				// Scenario: Checkbox group (Checked at least two items)
				expect(
					getResult(coerceFormValue(createSchema()).safeParse(['a', 'b'])),
				).toEqual({
					success: false,
					error: {
						'': ['max'],
					},
				});
				// Scenario: File upload (No file selected)
				const emptyFile = new File([], '');
				const textFile = new File(['helloword'], 'example.txt');

				expect(
					getResult(coerceFormValue(createSchema(file())).safeParse(emptyFile)),
				).toEqual({
					success: false,
					error: {
						'': ['min'],
					},
				});
				// Scenario: File upload (Only one file selected)
				expect(
					getResult(coerceFormValue(createSchema(file())).safeParse(textFile)),
				).toEqual({
					success: true,
					data: [textFile],
				});
				// Scenario: File upload (At least two files selected)
				expect(
					getResult(
						coerceFormValue(createSchema(file())).safeParse([
							textFile,
							textFile,
						]),
					),
				).toEqual({
					success: false,
					error: {
						'': ['max'],
					},
				});
				// Scenario: Only one input with the specific name
				expect(
					getResult(coerceFormValue(createSchema()).safeParse([''])),
				).toEqual({
					success: false,
					error: {
						'[0]': ['required'],
					},
				});
				// Scenario: Group of inputs with the same name
				expect(
					getResult(coerceFormValue(createSchema()).safeParse(['a', ''])),
				).toEqual({
					success: false,
					error: {
						'': ['max'],
						'[1]': ['required'],
					},
				});
			});
		});
	});
});
