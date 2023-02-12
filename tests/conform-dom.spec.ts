import { test, expect } from '@playwright/test';
import { parse, getPaths, getName, list } from '@conform-to/dom';
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
					{ resolve: () => ({ error: {} }) },
				),
			).toEqual({
				intent: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {},
				toJSON: expect.any(Function),
			});
			expect(
				parse(
					createFormData([
						['account', 'AB00 1111 2222 3333 4444'],
						['amount.currency', 'EUR'],
						['amount.value', '99.9'],
						['reference', ''],
					]),
					{ resolve: () => ({ error: {} }) },
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
				toJSON: expect.any(Function),
			});
			expect(
				parse(
					createFormData([
						['title', ''],
						['tasks[0].content', 'Test some stuffs'],
						['tasks[0].completed', 'Yes'],
						['tasks[1].content', 'Test integration'],
					]),
					{ resolve: () => ({ error: {} }) },
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
				toJSON: expect.any(Function),
			});
		});

		test('URLSearchParams', () => {
			expect(
				parse(
					new URLSearchParams([
						['title', 'The cat'],
						['description', 'Once upon a time...'],
					]),
					{ resolve: () => ({ error: {} }) },
				),
			).toEqual({
				intent: 'submit',
				payload: {
					title: 'The cat',
					description: 'Once upon a time...',
				},
				error: {},
				toJSON: expect.any(Function),
			});
		});

		test('Command submission', () => {
			expect(
				parse(
					createFormData([
						['title', 'Test command'],
						['__intent__', 'command value'],
					]),
					{ resolve: () => ({ error: {} }) },
				),
			).toEqual({
				intent: 'command value',
				payload: {
					title: 'Test command',
				},
				error: {},
				toJSON: expect.any(Function),
			});
			expect(
				parse(
					createFormData([
						['title', ''],
						['__intent__', 'list/helloworld'],
					]),
					{ resolve: () => ({ error: {} }) },
				),
			).toEqual({
				intent: 'list/helloworld',
				payload: {
					title: '',
				},
				error: {},
				toJSON: expect.any(Function),
			});
		});

		test('List command', () => {
			const entries: Array<[string, string]> = [
				['tasks[0].content', 'Test some stuffs'],
				['tasks[0].completed', 'Yes'],
			];
			const result = {
				payload: {
					tasks: [{ content: 'Test some stuffs', completed: 'Yes' }],
				},
				error: {},
				toJSON: expect.any(Function),
			};

			const command1 = list.prepend('tasks');

			expect(
				parse(createFormData([...entries, [command1.name, command1.value]]), {
					resolve: () => ({ error: {} }),
				}),
			).toEqual({
				...result,
				intent: command1.value,
				payload: {
					tasks: [undefined, ...result.payload.tasks],
				},
			});

			const command2 = list.prepend('tasks', {
				defaultValue: { content: 'Something' },
			});

			expect(
				parse(createFormData([...entries, [command2.name, command2.value]]), {
					resolve: () => ({ error: {} }),
				}),
			).toEqual({
				...result,
				intent: command2.value,
				payload: {
					tasks: [{ content: 'Something' }, ...result.payload.tasks],
				},
			});

			const command3 = list.append('tasks');

			expect(
				parse(createFormData([...entries, [command3.name, command3.value]]), {
					resolve: () => ({ error: {} }),
				}),
			).toEqual({
				...result,
				intent: command3.value,
				payload: {
					tasks: [...result.payload.tasks, undefined],
				},
			});

			const command4 = list.append('tasks', {
				defaultValue: { content: 'Something' },
			});

			expect(
				parse(createFormData([...entries, [command4.name, command4.value]]), {
					resolve: () => ({ error: {} }),
				}),
			).toEqual({
				...result,
				intent: command4.value,
				payload: {
					tasks: [...result.payload.tasks, { content: 'Something' }],
				},
			});

			const command5 = list.replace('tasks', {
				defaultValue: { content: 'Something' },
				index: 0,
			});

			expect(
				parse(createFormData([...entries, [command5.name, command5.value]]), {
					resolve: () => ({ error: {} }),
				}),
			).toEqual({
				...result,
				intent: command5.value,
				payload: {
					tasks: [{ content: 'Something' }],
				},
			});

			const command6 = list.remove('tasks', { index: 0 });

			expect(
				parse(createFormData([...entries, [command6.name, command6.value]]), {
					resolve: () => ({ error: {} }),
				}),
			).toEqual({
				...result,
				intent: command6.value,
				payload: {
					tasks: [],
				},
			});

			const command7 = list.reorder('tasks', { from: 0, to: 1 });

			expect(
				parse(
					createFormData([
						...entries,
						['tasks[1].content', 'Test more stuffs'],
						[command7.name, command7.value],
					]),
					{ resolve: () => ({ error: {} }) },
				),
			).toEqual({
				...result,
				intent: command7.value,
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
});
