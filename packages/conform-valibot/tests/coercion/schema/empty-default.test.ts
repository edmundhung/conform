import * as v from 'valibot';
import { describe, expect, test, vi } from 'vitest';
import { parseWithValibot } from '../../../parse';
import { createFormData } from '../../helpers/FormData';

describe.each([
	['optional', v.optional],
	['nullish', v.nullish],
	['optionalAsync', v.optionalAsync],
	['nullishAsync', v.nullishAsync],
] as const)(
	'%s with an empty-string default',
	(
		_name,
		wrap: (
			inner: v.GenericSchema<string, string>,
			defaultValue: string | (() => string),
		) => v.GenericSchema | v.GenericSchemaAsync,
	) => {
		test.each([
			['literal', ''],
			['factory', () => ''],
		] as const)('should preserve a %s default', async (_kind, defaultValue) => {
			for (const inner of [
				v.string(),
				v.pipe(v.string(), v.trim(), v.maxLength(10)),
			]) {
				const schema = v.objectAsync({ notes: wrap(inner, defaultValue) });
				for (const formData of [new FormData(), createFormData('notes', '')]) {
					expect(await parseWithValibot(formData, { schema })).toMatchObject({
						status: 'success',
						value: { notes: '' },
					});
				}
				expect(
					await parseWithValibot(createFormData('notes', 'hello'), { schema }),
				).toMatchObject({ status: 'success', value: { notes: 'hello' } });
			}
		});

		test('should still apply inner transformations and validation', async () => {
			const schema = v.objectAsync({
				notes: wrap(v.pipe(v.string(), v.trim(), v.maxLength(10)), ''),
			});
			expect(
				await parseWithValibot(createFormData('notes', ' hello '), { schema }),
			).toMatchObject({ status: 'success', value: { notes: 'hello' } });
			expect(
				await parseWithValibot(createFormData('notes', 'too long a value'), {
					schema,
				}),
			).toMatchObject({ status: 'error', error: { notes: expect.any(Array) } });
			const required = v.objectAsync({
				notes: wrap(v.pipe(v.string(), v.minLength(1, 'Required')), ''),
			});
			expect(
				await parseWithValibot(new FormData(), { schema: required }),
			).toMatchObject({
				status: 'error',
				error: { notes: ['Required'] },
			});
		});

		test('should resolve default factories only when needed', async () => {
			const defaultValue = vi.fn(() => '');
			const schema = v.objectAsync({ notes: wrap(v.string(), defaultValue) });
			expect(
				await parseWithValibot(createFormData('notes', 'hello'), { schema }),
			).toMatchObject({ status: 'success', value: { notes: 'hello' } });
			expect(defaultValue).not.toHaveBeenCalled();
			for (const value of ['default', '']) {
				defaultValue.mockReturnValue(value);
				expect(
					await parseWithValibot(new FormData(), { schema }),
				).toMatchObject({
					status: 'success',
					value: { notes: value },
				});
			}
		});
	},
);

test('should preserve empty-string defaults in synchronous forms', () => {
	const schema = v.object({
		optional: v.optional(v.string(), ''),
		nullish: v.nullish(v.string(), ''),
	});
	for (const formData of [
		new FormData(),
		new URLSearchParams({ optional: '', nullish: '' }),
	]) {
		expect(parseWithValibot(formData, { schema })).toMatchObject({
			status: 'success',
			value: { optional: '', nullish: '' },
		});
	}
});

test('should preserve other default values', () => {
	const schema = v.object({
		text: v.optional(v.string(), 'default'),
		number: v.optional(v.number(), 0),
		boolean: v.optional(v.boolean(), false),
		array: v.optional(v.array(v.string()), []),
		nullable: v.nullish(v.nullable(v.string()), null),
	});
	for (const formData of [
		new FormData(),
		new URLSearchParams({
			text: '',
			number: '',
			boolean: '',
			array: '',
			nullable: '',
		}),
	]) {
		expect(parseWithValibot(formData, { schema })).toMatchObject({
			status: 'success',
			value: {
				text: 'default',
				number: 0,
				boolean: false,
				array: [],
				nullable: null,
			},
		});
	}
});

test.each([v.optionalAsync, v.nullishAsync])(
	'should preserve an async empty-string default',
	async (
		wrap: (
			inner: v.GenericSchemaAsync<string, string>,
			defaultValue: () => Promise<string>,
		) => v.GenericSchemaAsync,
	) => {
		const schema = v.objectAsync({
			notes: wrap(
				v.pipeAsync(v.string(), v.trim(), v.maxLength(10)),
				async () => '',
			),
		});
		for (const formData of [new FormData(), createFormData('notes', '')]) {
			expect(await parseWithValibot(formData, { schema })).toMatchObject({
				status: 'success',
				value: { notes: '' },
			});
		}
	},
);

test('should preserve empty-string defaults in undefinedable schemas', () => {
	const schema = v.object({
		notes: v.undefinedable(v.pipe(v.string(), v.trim()), ''),
	});
	expect(
		parseWithValibot(createFormData('notes', ''), { schema }),
	).toMatchObject({ status: 'success', value: { notes: '' } });
	expect(
		parseWithValibot(createFormData('notes', ' hello '), { schema }),
	).toMatchObject({ status: 'success', value: { notes: 'hello' } });
});

test.each([v.exactOptional, v.exactOptionalAsync])(
	'should preserve empty-string defaults in exact optional schemas',
	async (
		wrap: (
			inner: v.GenericSchema<string, string>,
			defaultValue: string,
		) => v.GenericSchema | v.GenericSchemaAsync,
	) => {
		const schema = v.objectAsync({
			notes: wrap(v.pipe(v.string(), v.maxLength(10)), ''),
		});
		expect(await parseWithValibot(new FormData(), { schema })).toMatchObject({
			status: 'success',
			value: { notes: '' },
		});
		expect(
			await parseWithValibot(createFormData('notes', 'hello'), { schema }),
		).toMatchObject({ status: 'success', value: { notes: 'hello' } });
	},
);
