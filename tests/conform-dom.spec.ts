import { test, expect } from '@playwright/test';
import {
	parse,
	getPaths,
	getName,
	list,
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
				parseIntent(list.prepend('tasks', { defaultValue: 'testing' }).value),
			).toEqual({
				type: 'list',
				payload: {
					name: 'tasks',
					operation: 'prepend',
					defaultValue: 'testing',
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
