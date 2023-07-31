import { test, expect } from '@playwright/test';
import {
	INTENT,
	parse,
	getPaths,
	getName,
	list,
	getIntent,
	parseIntent,
	validate,
} from '@conform-to/dom';
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
				intent: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {},
				report: expect.any(Function),
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
				intent: 'submit',
				payload: {
					account: 'AB00 1111 2222 3333 4444',
					amount: {
						currency: 'EUR',
						value: '99.9',
					},
					reference: '',
				},
				error: {},
				report: expect.any(Function),
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
				intent: 'submit',
				payload: {
					title: '',
					tasks: [
						{ content: 'Test some stuffs', completed: 'Yes' },
						{ content: 'Test integration' },
					],
				},
				error: {},
				report: expect.any(Function),
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
				intent: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {},
				report: expect.any(Function),
			});
		});

		test('Processing submission intent', () => {
			expect(
				parse(
					createFormData([
						['title', 'Test intent'],
						['__intent__', 'intent value'],
					]),
				),
			).toEqual({
				intent: 'intent value',
				payload: {
					title: 'Test intent',
				},
				error: {},
				report: expect.any(Function),
			});
			expect(() =>
				parse(
					createFormData([
						['title', ''],
						['__intent__', 'list/helloworld'],
					]),
				),
			).toThrow('Failed parsing intent: list/helloworld');
		});

		test('List intent', () => {
			const entries: Array<[string, string]> = [
				['tasks[0].content', 'Test some stuffs'],
				['tasks[0].completed', 'Yes'],
			];
			const result = {
				payload: {
					tasks: [{ content: 'Test some stuffs', completed: 'Yes' }],
				},
				error: {},
				report: expect.any(Function),
			};

			const intent1 = list.prepend('tasks');

			expect(
				parse(createFormData([...entries, [intent1.name, intent1.value]])),
			).toEqual({
				...result,
				intent: intent1.value,
				payload: {
					tasks: [undefined, ...result.payload.tasks],
				},
			});

			const intent2 = list.prepend('tasks', {
				defaultValue: { content: 'Something' },
			});

			expect(
				parse(createFormData([...entries, [intent2.name, intent2.value]])),
			).toEqual({
				...result,
				intent: intent2.value,
				payload: {
					tasks: [{ content: 'Something' }, ...result.payload.tasks],
				},
			});

			const intent3 = list.append('tasks');

			expect(
				parse(createFormData([...entries, [intent3.name, intent3.value]])),
			).toEqual({
				...result,
				intent: intent3.value,
				payload: {
					tasks: [...result.payload.tasks, undefined],
				},
			});

			const intent4 = list.append('tasks', {
				defaultValue: { content: 'Something' },
			});

			expect(
				parse(createFormData([...entries, [intent4.name, intent4.value]])),
			).toEqual({
				...result,
				intent: intent4.value,
				payload: {
					tasks: [...result.payload.tasks, { content: 'Something' }],
				},
			});

			const intent5 = list.replace('tasks', {
				defaultValue: { content: 'Something' },
				index: 0,
			});

			expect(
				parse(createFormData([...entries, [intent5.name, intent5.value]])),
			).toEqual({
				...result,
				intent: intent5.value,
				payload: {
					tasks: [{ content: 'Something' }],
				},
			});

			const intent6 = list.remove('tasks', { index: 0 });

			expect(
				parse(createFormData([...entries, [intent6.name, intent6.value]])),
			).toEqual({
				...result,
				intent: intent6.value,
				payload: {
					tasks: [],
				},
			});

			const intent7 = list.reorder('tasks', { from: 0, to: 1 });

			expect(
				parse(
					createFormData([
						...entries,
						['tasks[1].content', 'Test more stuffs'],
						[intent7.name, intent7.value],
					]),
				),
			).toEqual({
				...result,
				intent: intent7.value,
				payload: {
					tasks: [{ content: 'Test more stuffs' }, ...result.payload.tasks],
				},
			});
		});

		test('report', () => {
			const formData = createFormData([
				['title', 'The cat'],
				['description', 'Once upon a time...'],
			]);
			const result = {
				intent: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {},
			};

			const submission1 = parse(formData, {
				resolve: () => ({
					error: {
						'': ['Something went wrong'],
						title: ['Meow'],
					},
				}),
			});

			expect(submission1.report()).toEqual({
				...result,
				error: {
					'': ['Something went wrong'],
					title: ['Meow'],
				},
			});
			expect(
				submission1.report({
					formError: ['Test error'],
				}),
			).toEqual({
				...result,
				error: {
					'': ['Something went wrong', 'Test error'],
					title: ['Meow'],
				},
			});
			expect(
				submission1.report({
					fieldError: {
						description: ['Test error'],
					},
				}),
			).toEqual({
				...result,
				error: {
					'': ['Something went wrong'],
					title: ['Meow'],
					description: ['Test error'],
				},
			});

			const submission2 = parse(formData, {
				resolve: (payload) => ({
					value: payload,
				}),
			});
			expect(submission2.report()).toEqual(result);
			expect(submission2.report({ formError: ['foo', 'bar'] })).toEqual({
				...result,
				error: {
					'': ['foo', 'bar'],
				},
			});
			expect(
				submission2.report({
					formError: ['foo'],
					fieldError: { title: ['bar'] },
				}),
			).toEqual({
				...result,
				error: {
					'': ['foo'],
					title: ['bar'],
				},
			});
			expect(submission2.report({ resetForm: true })).toEqual({
				...result,
				payload: null,
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

	test.describe('getIntent', () => {
		test('Default value', () => {
			expect(getIntent(createFormData([]))).toEqual('submit');
			expect(getIntent(createFormData([['foo', 'bar']]))).toEqual('submit');
		});

		test('Normal result', () => {
			expect(getIntent(createFormData([[INTENT, 'test']]))).toEqual('test');
		});

		test('Multiple intents', () => {
			expect(
				getIntent(
					createFormData([
						[INTENT, 'test'],
						[INTENT, 'test'],
					]),
				),
			).toEqual('test');
			expect(() =>
				getIntent(
					createFormData([
						[INTENT, 'test1'],
						[INTENT, 'test2'],
					]),
				),
			).toThrow();
			expect(() =>
				getIntent(
					createFormData([
						[INTENT, 'test'],
						[INTENT, 'test'],
						[INTENT, 'test'],
					]),
				),
			).toThrow();
		});
	});

	test.describe('parseIntent', () => {
		test('default submission', () => {
			expect(parseIntent(parse(new FormData()).intent)).toEqual(null);
		});

		test('validate intent', () => {
			expect(parseIntent(validate('something').value)).toEqual({
				type: 'validate',
				payload: 'something',
			});
		});

		test('list intent', () => {
			expect(parseIntent(list.append('items').value)).toEqual({
				type: 'list',
				payload: {
					name: 'items',
					operation: 'append',
				},
			});
			expect(
				parseIntent(
					list.prepend('tasks', { defaultValue: 'testing/seperator' }).value,
				),
			).toEqual({
				type: 'list',
				payload: {
					name: 'tasks',
					operation: 'prepend',
					defaultValue: 'testing/seperator',
				},
			});
			expect(parseIntent(list.remove('tasks', { index: 0 }).value)).toEqual({
				type: 'list',
				payload: {
					name: 'tasks',
					operation: 'remove',
					index: 0,
				},
			});
			expect(
				parseIntent(list.reorder('tasks', { from: 1, to: 2 }).value),
			).toEqual({
				type: 'list',
				payload: {
					name: 'tasks',
					operation: 'reorder',
					from: 1,
					to: 2,
				},
			});
			expect(
				parseIntent(
					list.replace('tasks', { defaultValue: '', index: 0 }).value,
				),
			).toEqual({
				type: 'list',
				payload: {
					name: 'tasks',
					operation: 'replace',
					defaultValue: '',
					index: 0,
				},
			});
		});

		test('custom intent', () => {
			expect(parseIntent('submit/something')).toEqual(null);
			expect(parseIntent('testing')).toEqual(null);
		});
	});
});
