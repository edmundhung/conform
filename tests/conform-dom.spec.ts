import { test, expect } from '@playwright/test';
import { parse, getPaths, getName } from '@conform-to/dom';
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
				type: 'submit',
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
				type: 'submit',
				value: {
					account: 'AB00 1111 2222 3333 4444',
					amount: {
						currency: 'EUR',
						value: '99.9',
					},
					reference: '',
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
				type: 'submit',
				value: {
					title: '',
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
				type: 'submit',
				value: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: [],
			});
		});

		test('Command submission', () => {
			expect(
				parse(
					createFormData([
						['title', 'Test command'],
						['conform/test', 'command value'],
					]),
				),
			).toEqual({
				type: 'test',
				intent: 'command value',
				value: {
					title: 'Test command',
				},
				error: [],
			});
			expect(
				parse(
					createFormData([
						['title', ''],
						['conform/list', JSON.stringify({ greeting: 'Hello World' })],
					]),
				),
			).toEqual({
				type: 'list',
				intent: JSON.stringify({ greeting: 'Hello World' }),
				value: {
					title: '',
				},
				error: [
					[
						'',
						'Invalid list command: "{"greeting":"Hello World"}"; Error: Unknown list command received: undefined',
					],
				],
			});
		});

		test('List command', () => {
			const entries: Array<[string, string]> = [
				['tasks[0].content', 'Test some stuffs'],
				['tasks[0].completed', 'Yes'],
			];
			const result = {
				type: 'list',
				value: {
					tasks: [{ content: 'Test some stuffs', completed: 'Yes' }],
				},
				error: [],
			};

			expect(
				parse(
					createFormData([
						...entries,
						[
							'conform/list',
							JSON.stringify({ type: 'prepend', scope: 'tasks', payload: {} }),
						],
					]),
				),
			).toEqual({
				...result,
				intent: JSON.stringify({
					type: 'prepend',
					scope: 'tasks',
					payload: {},
				}),
				value: {
					tasks: [undefined, ...result.value.tasks],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							'conform/list',
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
				intent: JSON.stringify({
					type: 'prepend',
					scope: 'tasks',
					payload: { defaultValue: { content: 'Something' } },
				}),
				value: {
					tasks: [{ content: 'Something' }, ...result.value.tasks],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							'conform/list',
							JSON.stringify({ type: 'append', scope: 'tasks', payload: {} }),
						],
					]),
				),
			).toEqual({
				...result,
				intent: JSON.stringify({
					type: 'append',
					scope: 'tasks',
					payload: {},
				}),
				value: {
					tasks: [...result.value.tasks, undefined],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							'conform/list',
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
				intent: JSON.stringify({
					type: 'append',
					scope: 'tasks',
					payload: { defaultValue: { content: 'Something' } },
				}),
				value: {
					tasks: [...result.value.tasks, { content: 'Something' }],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							'conform/list',
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
				intent: JSON.stringify({
					type: 'replace',
					scope: 'tasks',
					payload: { defaultValue: { content: 'Something' }, index: 0 },
				}),
				value: {
					tasks: [{ content: 'Something' }],
				},
			});
			expect(
				parse(
					createFormData([
						...entries,
						[
							'conform/list',
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
				intent: JSON.stringify({
					type: 'remove',
					scope: 'tasks',
					payload: { index: 0 },
				}),
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
							'conform/list',
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
				intent: JSON.stringify({
					type: 'reorder',
					scope: 'tasks',
					payload: { from: 0, to: 1 },
				}),
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
