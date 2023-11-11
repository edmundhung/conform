import { test, expect } from '@playwright/test';
import { STATE, parse, getPaths, formatPaths } from '@conform-to/dom';
import { installGlobals } from '@remix-run/node';

function createFormData(entries: Array<[string, string | File]>): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

const defaultState = JSON.stringify({ key: {}, validated: {} });

test.beforeAll(() => {
	installGlobals();
});

test.describe('conform-dom', () => {
	test.describe('parse', () => {
		test('FormData', () => {
			expect(
				parse(
					createFormData([
						[STATE, defaultState],
						['title', 'The cat'],
						['description', 'Once upon a time...'],
					]),
					{
						resolve() {
							return { error: { title: ['Test'] } };
						},
					},
				),
			).toEqual({
				type: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {
					title: ['Test'],
				},
				value: null,
				accept: expect.any(Function),
				reject: expect.any(Function),
			});

			expect(
				parse(
					createFormData([
						[STATE, defaultState],
						['account', 'AB00 1111 2222 3333 4444'],
						['amount.currency', 'EUR'],
						['amount.value', '99.9'],
						['reference', ''],
					]),
					{
						resolve() {
							return { error: { account: ['Test'] } };
						},
					},
				),
			).toEqual({
				type: 'submit',
				payload: {
					account: 'AB00 1111 2222 3333 4444',
					amount: {
						currency: 'EUR',
						value: '99.9',
					},
					reference: '',
				},
				error: {
					account: ['Test'],
				},
				value: null,
				accept: expect.any(Function),
				reject: expect.any(Function),
			});

			expect(
				parse(
					createFormData([
						[STATE, defaultState],
						['title', ''],
						['tasks[0].content', 'Test some stuffs'],
						['tasks[0].completed', 'Yes'],
						['tasks[1].content', 'Test integration'],
					]),
					{
						resolve() {
							return { error: { title: ['Test'] } };
						},
					},
				),
			).toEqual({
				type: 'submit',
				payload: {
					title: '',
					tasks: [
						{ content: 'Test some stuffs', completed: 'Yes' },
						{ content: 'Test integration' },
					],
				},
				error: {
					title: ['Test'],
				},
				value: null,
				accept: expect.any(Function),
				reject: expect.any(Function),
			});
		});

		test('URLSearchParams', () => {
			expect(
				parse(
					new URLSearchParams([
						[STATE, defaultState],
						['title', 'The cat'],
						['description', 'Once upon a time...'],
					]),
					{
						resolve() {
							return { error: { title: ['Test'] } };
						},
					},
				),
			).toEqual({
				type: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {
					title: ['Test'],
				},
				value: null,
				accept: expect.any(Function),
				reject: expect.any(Function),
			});
		});
	});

	test.describe('getPaths', () => {
		test('Expected inputs', () => {
			expect(getPaths('')).toEqual([]);
			expect(getPaths('title')).toEqual(['title']);
			expect(getPaths('123')).toEqual(['123']);
			expect(getPaths('amount.currency')).toEqual(['amount', 'currency']);
			expect(getPaths('[0]')).toEqual([0]);
			expect(getPaths('tasks[0]')).toEqual(['tasks', 0]);
			expect(getPaths('tasks[1].completed')).toEqual(['tasks', 1, 'completed']);
			expect(getPaths('multiple[0][1][2]')).toEqual(['multiple', 0, 1, 2]);
			expect(getPaths('books[0].chapters[1]')).toEqual([
				'books',
				0,
				'chapters',
				1,
			]);
		});
	});

	test.describe('formatPaths', () => {
		test('Expected inputs', () => {
			expect(formatPaths([])).toEqual('');
			expect(formatPaths([0])).toEqual('[0]');
			expect(formatPaths(['title'])).toEqual('title');
			expect(formatPaths(['amount', 'currency'])).toEqual('amount.currency');
			expect(formatPaths(['tasks', 0])).toEqual('tasks[0]');
			expect(formatPaths(['tasks', 1, 'completed'])).toEqual(
				'tasks[1].completed',
			);
		});
	});
});
