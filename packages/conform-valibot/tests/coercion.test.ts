import {
	type GenericSchema,
	type GenericSchemaAsync,
	bigint,
	boolean,
	date,
	number,
	object,
	string,
	safeParse,
} from 'valibot';
import { describe, expect, test } from 'vitest';
import { coerceFormValue, type CoercionFunction } from '../coercion';
import { getResult } from './helpers/valibot';

describe('coerceFormValue', () => {
	test('default behavior without options', () => {
		const schema = object({
			text: string(),
			num: number(),
			flag: boolean(),
			timestamp: date(),
			bigNumber: bigint(),
		});

		const coercedSchema = coerceFormValue(schema);
		const result = safeParse(coercedSchema as GenericSchema, {
			text: 'hello',
			num: '123',
			flag: 'on',
			timestamp: '2023-01-01',
			bigNumber: '9007199254740991',
		});
		expect(getResult(result)).toEqual({
			success: true,
			data: {
				text: 'hello',
				num: 123,
				flag: true,
				timestamp: new Date('2023-01-01'),
				bigNumber: BigInt('9007199254740991'),
			},
		});
	});

	describe('behavior with options', () => {
		describe('defaultCoercion', () => {
			test('disable specific type coercion', () => {
				const schema = object({
					text: string(),
					num: number(),
					flag: boolean(),
					timestamp: date(),
					bigNumber: bigint(),
				});

				const coercedSchemaWithoutNumber = coerceFormValue(schema, {
					defaultCoercion: {
						number: false,
						boolean: false,
						date: false,
						bigint: false,
					},
				});

				const result = safeParse(coercedSchemaWithoutNumber, {
					text: 'hello',
					num: '123',
					flag: 'on',
					timestamp: '2023-01-01',
					bigNumber: '9007199254740991',
				});
				expect(getResult(result)).toEqual({
					success: false,
					error: {
						num: [expect.anything()],
						flag: [expect.anything()],
						timestamp: [expect.anything()],
						bigNumber: [expect.anything()],
					},
				});
			});

			test('custom coercion functions', () => {
				const schema = object({
					text: string(),
					num: number(),
					flag: boolean(),
					timestamp: date(),
					bigNumber: bigint(),
				});

				const customStringCoercion: CoercionFunction = (value) => {
					if (typeof value !== 'string') {
						return value;
					}
					return value === '' ? value : value.toUpperCase();
				};

				const customNumberCoercion: CoercionFunction = (value) => {
					if (typeof value !== 'string') {
						return value;
					}
					return value.trim() === '' ? value : Number(value) * 2;
				};

				const customDateCoercion: CoercionFunction = (value) => {
					if (typeof value !== 'string') {
						return value;
					}
					const date = new Date(value);
					date.setDate(date.getDate() + 1);
					return date;
				};

				const customBigIntCoercion: CoercionFunction = (value) => {
					if (typeof value !== 'string') {
						return value;
					}
					const data = BigInt(value);
					return data + BigInt(1);
				};

				const coercedSchema = coerceFormValue(schema, {
					defaultCoercion: {
						string: customStringCoercion,
						number: customNumberCoercion,
						date: customDateCoercion,
						bigint: customBigIntCoercion,
					},
				});

				const result = safeParse(coercedSchema, {
					text: 'hello',
					num: '10',
					flag: 'on',
					timestamp: '2023-01-01',
					bigNumber: '9007199254740991',
				});
				expect(getResult(result)).toEqual({
					success: true,
					data: {
						text: 'HELLO',
						num: 20,
						flag: true,
						timestamp: new Date('2023-01-02'),
						bigNumber: BigInt('9007199254740992'),
					},
				});
			});
		});

		describe('defineCoercion', () => {
			test('defineCoercion for specific schema types', () => {
				const meta = object({
					text: string(),
					num: number(),
				});
				const schema = object({
					text: string(),
					num: number(),
					timestamp: date(),
					yes: boolean(),
					no: boolean(),
					meta,
				});

				const defineCoercion = (
					schema: GenericSchema | GenericSchemaAsync,
				): CoercionFunction | null => {
					if (schema.type === 'string') {
						return (value) => {
							if (typeof value === 'string') {
								return value.trim() === '' ? undefined : value.trim();
							}
							return value;
						};
					}

					if (schema.type === 'boolean') {
						return (value) => {
							if (typeof value === 'string') {
								if (value === 'yes') {
									return true;
								}
								if (value === 'no') {
									return false;
								}
							}
							return value;
						};
					}

					if (schema === meta) {
						return (value) => {
							if (value === undefined) {
								return {
									text: 'text',
									num: 0,
								};
							}
							return value;
						};
					}

					return null;
				};

				const coercedSchema = coerceFormValue(schema, {
					defineCoercion,
				});

				const result = safeParse(coercedSchema, {
					text: '  hello  ',
					num: '123',
					timestamp: '2023-01-01',
					yes: 'yes',
					no: 'no',
					meta: undefined,
				});
				expect(getResult(result)).toEqual({
					success: true,
					data: {
						text: 'hello',
						num: 123,
						timestamp: new Date('2023-01-01'),
						yes: true,
						no: false,
						meta: {
							text: 'text',
							num: 0,
						},
					},
				});
			});
		});
	});
});
