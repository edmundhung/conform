import { test, expect } from '@playwright/test';
import { parse, getPaths, getName, controlButtonName } from '@conform-to/dom';
import { installGlobals } from '@remix-run/node';

function createFormData(entries: Array<[string, string | File]>): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

test.beforeAll(() => {
	installGlobals();
});

test.describe('conform-dom', () => {
	test.describe('parse', () => {
		test('FormData', () => {
			expect(
				parse(
					createFormData([
						['title', 'The cat'],
						['description', 'Once upon a time...'],
					]),
				),
			).toEqual({
				value: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: [],
			});
			expect(
				parse(
					createFormData([
						['account', 'AB00 1111 2222 3333 4444'],
						['amount.currency', 'EUR'],
						['amount.value', '99.9'],
						['reference', ''],
					]),
				),
			).toEqual({
				value: {
					account: 'AB00 1111 2222 3333 4444',
					amount: {
						currency: 'EUR',
						value: '99.9',
					},
				},
				error: [],
			});
			expect(
				parse(
					createFormData([
						['title', ''],
						['tasks[0].content', 'Test some stuffs'],
						['tasks[0].completed', 'Yes'],
						['tasks[1].content', 'Test integration'],
					]),
				),
			).toEqual({
				value: {
					tasks: [
						{ content: 'Test some stuffs', completed: 'Yes' },
						{ content: 'Test integration' },
					],
				},
				error: [],
			});
		});

		test('URLSearchParams', () => {
			expect(
				parse(
					new URLSearchParams([
						['title', 'The cat'],
						['description', 'Once upon a time...'],
					]),
				),
			).toEqual({
				value: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: [],
			});
		});

		test('Invalid command', () => {
			expect(
				parse(
					createFormData([
						['title', 'Test command'],
						[controlButtonName, 'invalid command'],
					]),
				),
			).toEqual({
				value: {
					title: 'Test command',
				},
				error: [['', 'Invalid command received']],
			});
			expect(
				parse(
					createFormData([
						['title', ''],
						[controlButtonName, JSON.stringify({ greeting: 'Hello World' })],
					]),
				),
			).toEqual({
				value: {},
				error: [['', 'Invalid command received']],
			});
			expect(
				parse(
					createFormData([
						['title', ''],
						[controlButtonName, JSON.stringify({ type: 'test' })],
					]),
				),
			).toEqual({
				value: {},
				error: [['', 'Unknown command received']],
			});
		});

		test('List command', () => {
			const entries: Array<[string, string]> = [
				['tasks[0].content', 'Test some stuffs'],
				['tasks[0].completed', 'Yes'],
			];
			const result = {
				touched: ['tasks'],
				value: {
					tasks: [{ content: 'Test some stuffs', completed: 'Yes' }],
				},
				error: [[controlButtonName, 'List modified']],
			};

			expect(
				parse(
					createFormData([
						...entries,
						[
							controlButtonName,
							JSON.stringify({ type: 'prepend', scope: 'tasks', payload: {} }),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [undefined, ...result.value.tasks],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							controlButtonName,
							JSON.stringify({
								type: 'prepend',
								scope: 'tasks',
								payload: { defaultValue: { content: 'Something' } },
							}),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [{ content: 'Something' }, ...result.value.tasks],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							controlButtonName,
							JSON.stringify({ type: 'append', scope: 'tasks', payload: {} }),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [...result.value.tasks, undefined],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							controlButtonName,
							JSON.stringify({
								type: 'append',
								scope: 'tasks',
								payload: { defaultValue: { content: 'Something' } },
							}),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [...result.value.tasks, { content: 'Something' }],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							controlButtonName,
							JSON.stringify({
								type: 'replace',
								scope: 'tasks',
								payload: { defaultValue: { content: 'Something' }, index: 0 },
							}),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [{ content: 'Something' }],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							controlButtonName,
							JSON.stringify({
								type: 'remove',
								scope: 'tasks',
								payload: { index: 0 },
							}),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						['tasks[1].content', 'Test more stuffs'],
						[
							controlButtonName,
							JSON.stringify({
								type: 'reorder',
								scope: 'tasks',
								payload: { from: 0, to: 1 },
							}),
						],
					]),
				),
			).toEqual({
				...result,
				value: {
					tasks: [{ content: 'Test more stuffs' }, ...result.value.tasks],
				},
			});
		});
	});

	test.describe('getPaths', () => {
		test('Expected inputs', () => {
			expect(getPaths('')).toEqual([]);
			expect(getPaths('[0]')).toEqual([0]);
			expect(getPaths('title')).toEqual(['title']);
			expect(getPaths('amount.currency')).toEqual(['amount', 'currency']);
			expect(getPaths('tasks[0]')).toEqual(['tasks', 0]);
			expect(getPaths('tasks[1].completed')).toEqual(['tasks', 1, 'completed']);
		});
	});

	test.describe('getName', () => {
		test('Expected inputs', () => {
			expect(getName([])).toEqual('');
			expect(getName([0])).toEqual('[0]');
			expect(getName(['title'])).toEqual('title');
			expect(getName(['amount', 'currency'])).toEqual('amount.currency');
			expect(getName(['tasks', 0])).toEqual('tasks[0]');
			expect(getName(['tasks', 1, 'completed'])).toEqual('tasks[1].completed');
		});
	});
});
