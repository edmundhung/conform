import { beforeEach, vi, describe, test, expect } from 'vitest';
import { parseWithClassValidator } from '@conform-to/class-validator';
import { IsNotEmpty, Min, MinLength } from 'class-validator';
import { createFormData } from './helpers';

beforeEach(() => {
	vi.unstubAllGlobals();
});

interface IPayload {
	name: string;
	qty: string;
}

class TestModel {
	constructor(data: IPayload) {
		this.name = data.name;
		this.qty = Number(data.qty);
	}

	@IsNotEmpty({ message: 'IsNotEmpty' })
	@MinLength(3, { message: 'MinLength' })
	name: string;

	@Min(1, { message: 'Min' })
	qty: number;
}

describe('conform-class-validator', () => {
	describe('parseWithClassValidator', () => {
		test('no data', () => {
			expect(
				parseWithClassValidator(
					createFormData([
						['name', ''],
						['qty', ''],
					]),
					{
						schema: TestModel,
					},
				),
			).toEqual({
				status: 'error',
				payload: { name: '', qty: '' },
				error: { name: ['MinLength', 'IsNotEmpty'], qty: ['Min'] },
				reply: expect.any(Function),
			});
		});

		test('no name', () => {
			expect(
				parseWithClassValidator(createFormData([['qty', '5']]), {
					schema: TestModel,
				}),
			).toEqual({
				status: 'error',
				payload: { qty: '5' },
				error: { name: ['MinLength', 'IsNotEmpty'] },
				reply: expect.any(Function),
			});
		});

		test('no qty', () => {
			expect(
				parseWithClassValidator(createFormData([['name', 'John']]), {
					schema: TestModel,
				}),
			).toEqual({
				status: 'error',
				payload: { name: 'John' },
				error: { qty: ['Min'] },
				reply: expect.any(Function),
			});
		});

		test('all good', () => {
			expect(
				parseWithClassValidator(
					createFormData([
						['name', 'John'],
						['qty', '5'],
					]),
					{
						schema: TestModel,
					},
				),
			).toEqual({
				status: 'success',
				payload: { name: 'John', qty: '5' },
				value: { name: 'John', qty: 5 },
				reply: expect.any(Function),
			});
		});
	});
});
