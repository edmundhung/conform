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
						['__intent__', 'command value'],
					]),
				),
			).toEqual({
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
						['__intent__', 'list/helloworld'],
					]),
				),
			).toEqual({
				intent: 'list/helloworld',
				value: {
					title: '',
				},
				error: [],
			});
		});

		test('List command', () => {
			const entries: Array<[string, string]> = [
				['tasks[0].content', 'Test some stuffs'],
				['tasks[0].completed', 'Yes'],
			];
			const result = {
				value: {
					tasks: [{ content: 'Test some stuffs', completed: 'Yes' }],
				},
				error: [],
			};

			const command1 = list.prepend('tasks');

			expect(
				parse(createFormData([...entries, [command1.name, command1.value]])),
			).toEqual({
				...result,
				intent: command1.value,
				value: {
					tasks: [undefined, ...result.value.tasks],
				},
			});

			const command2 = list.prepend('tasks', {
				defaultValue: { content: 'Something' },
			});

			expect(
				parse(createFormData([...entries, [command2.name, command2.value]])),
			).toEqual({
				...result,
				intent: command2.value,
				value: {
					tasks: [{ content: 'Something' }, ...result.value.tasks],
				},
			});

			const command3 = list.append('tasks');

			expect(
				parse(createFormData([...entries, [command3.name, command3.value]])),
			).toEqual({
				...result,
				intent: command3.value,
				value: {
					tasks: [...result.value.tasks, undefined],
				},
			});

			const command4 = list.append('tasks', {
				defaultValue: { content: 'Something' },
			});

			expect(
				parse(createFormData([...entries, [command4.name, command4.value]])),
			).toEqual({
				...result,
				intent: command4.value,
				value: {
					tasks: [...result.value.tasks, { content: 'Something' }],
				},
			});

			const command5 = list.replace('tasks', {
				defaultValue: { content: 'Something' },
				index: 0,
			});

			expect(
				parse(createFormData([...entries, [command5.name, command5.value]])),
			).toEqual({
				...result,
				intent: command5.value,
				value: {
					tasks: [{ content: 'Something' }],
				},
			});

			const command6 = list.remove('tasks', { index: 0 });

			expect(
				parse(createFormData([...entries, [command6.name, command6.value]])),
			).toEqual({
				...result,
				intent: command6.value,
				value: {
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
				),
			).toEqual({
				...result,
				intent: command7.value,
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
