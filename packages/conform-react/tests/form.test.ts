import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import {
	applyIntent,
	initializeState,
	serializeIntent,
	updateState,
} from '../future/form';
import {
	getDefaultOptions,
	getDefaultValue,
	getError,
	getListKey,
	isValidated,
} from '../future/metadata';
import { parseSubmission, report } from '../future';
import { DEFAULT_INTENT } from '../future/hooks';
import {
	FormContext,
	InsertIntent,
	RemoveIntent,
	ReorderIntent,
	ResetIntent,
	UpdateIntent,
	ValidateIntent,
} from '../future/types';
import { FormValue, FormError, SubmissionResult } from '@conform-to/dom/future';

describe('form', () => {
	function createContext(
		customized?: Partial<FormContext<any, any>>,
	): FormContext<any, any> {
		return {
			formId: 'test-id',
			state: initializeState(),
			...customized,
		};
	}

	function createResult(
		entries: Array<[string, FormDataEntryValue]>,
		options?: {
			value?: Record<string, FormValue> | null;
			error?: Partial<FormError<any, any>> | null;
		},
	): SubmissionResult<any, any, any, any> {
		const formData = new FormData();

		for (const [name, value] of entries) {
			formData.append(name, value);
		}

		const submission = parseSubmission(formData, {
			intentName: DEFAULT_INTENT,
		});
		const [intent, value] = applyIntent(submission);

		return report(submission, {
			intent,
			value: typeof options?.value !== 'undefined' ? options.value : value,
			error: options?.error,
		});
	}

	const ctx = {
		reset() {
			return initializeState();
		},
	};

	beforeAll(() => {
		vi.useFakeTimers({ now: 0 });
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	test('form validation', () => {
		const context = createContext();

		// Test client validation with empty fields
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', ''],
					['password', ''],
				],
				{
					error: {
						fieldErrors: {
							username: 'Username is required',
							password: 'Password is required',
						},
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is required');
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test client validation with valid username
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', 'edmund'],
					['password', ''],
				],
				{
					error: {
						fieldErrors: {
							password: 'Password is required',
						},
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test client validation with no errors
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', 'edmund'],
					['password', 'my-secret-password'],
				],
				{ error: null },
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBeUndefined();

		// Test server validation
		context.state = updateState(context.state, {
			type: 'server',
			result: createResult(
				[
					['username', 'edmund'],
					['password', 'my-secret-password'],
				],
				{
					error: {
						formErrors: 'Username or password is incorrect',
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe('Username or password is incorrect');
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBeUndefined();

		// Test client validation with the same form value after server validation
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', 'edmund'],
					['password', 'my-secret-password'],
				],
				{ error: null },
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe('Username or password is incorrect');
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBeUndefined();

		// Test client validation with the form value updated after server validation
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', 'edmund'],
					['password', 'secret-password'],
				],
				{ error: null },
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBeUndefined();

		// Test server validation with a reset result
		context.state = updateState(context.state, {
			type: 'server',
			result: createResult(
				[
					['username', 'edmund'],
					['password', 'secret-password'],
				],
				{
					value: null,
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBeUndefined();
	});

	test('validate fields', () => {
		const context = createContext();

		// Update state with server validation result
		context.state = updateState(context.state, {
			type: 'server',
			result: createResult(
				[
					['username', ''],
					['password', ''],
					[
						DEFAULT_INTENT,
						serializeIntent<ValidateIntent>({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				{
					error: {
						fieldErrors: {
							username: 'Username is required',
							password: 'Password is required',
						},
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBe('Username is required');
		expect(getError(context.state, 'password')).toBe(undefined);

		// Update state with client validation result
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', 'edmund'],
					['password', ''],
					[
						DEFAULT_INTENT,
						serializeIntent<ValidateIntent>({
							type: 'validate',
							payload: 'password',
						}),
					],
				],
				{
					error: {
						fieldErrors: {
							username: 'Username is invalid',
							password: 'Password is required',
						},
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBe('Username is invalid');
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test resetting state with a reset intent
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['username', 'edmund'],
				['password', 'my-password'],
				[
					DEFAULT_INTENT,
					serializeIntent<ResetIntent>({
						type: 'reset',
					}),
				],
			]),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);
	});

	test('update fields throguh intent', () => {
		const context = createContext({
			defaultValue: {
				username: 'example',
				password: '*******',
			},
		});

		expect(getDefaultValue(context, 'username')).toBe('example');
		expect(getDefaultValue(context, 'password')).toBe('*******');
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBeUndefined();
		expect(getError(context.state, 'password')).toBeUndefined();

		context.state = updateState(context.state, {
			type: 'server',
			result: createResult(
				[
					['username', 'example'],
					['password', '*******'],
					[
						DEFAULT_INTENT,
						serializeIntent<UpdateIntent>({
							type: 'update',
							payload: {
								name: '',
								value: {
									username: 'edmund',
									password: 'my-secret-password',
								},
							},
						}),
					],
				],
				{
					error: {
						fieldErrors: {
							username: 'Username is invalid',
							password: 'Password is incorrect',
						},
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBe('Username is invalid');
		expect(getError(context.state, 'password')).toBe('Password is incorrect');

		// Update state with client validation result
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult(
				[
					['username', 'edmund'],
					['password', 'my-secret-password'],
					[
						DEFAULT_INTENT,
						serializeIntent<UpdateIntent>({
							type: 'update',
							payload: {
								name: 'password',
								value: '',
							},
						}),
					],
				],
				{
					error: {
						fieldErrors: {
							username: 'Username is invalid',
							password: 'Password is required',
						},
					},
				},
			),
			ctx,
		});

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBeUndefined();
		expect(getError(context.state, 'username')).toBe('Username is invalid');
		expect(getError(context.state, 'password')).toBe('Password is required');
	});

	test('modify list on the client', () => {
		const context = createContext({
			defaultValue: {
				title: 'My Tasks',
				tasks: ['Default task 1', 'Default task 2'],
			},
		});

		expect(getListKey(context, 'tasks')).toEqual(['tasks[0]', 'tasks[1]']);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Default task 1',
			'Default task 2',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Default task 1');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('Default task 2');
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(false);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(false);

		// Test inserting an item
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['title', 'My Tasks'],
				['tasks[0]', 'Default task 1'],
				['tasks[1]', 'Default task 2'],
				[
					DEFAULT_INTENT,
					serializeIntent<InsertIntent>({
						type: 'insert',
						payload: {
							name: 'tasks',
							defaultValue: 'New task',
						},
					}),
				],
			]),
			ctx,
		});

		expect(getListKey(context, 'tasks')).toEqual([
			'tasks[0]',
			'tasks[1]',
			'1970-01-01T00:00:00.000Z',
		]);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Default task 1',
			'Default task 2',
			'New task',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Default task 1');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('Default task 2');
		expect(getDefaultValue(context, 'tasks[2]')).toBe('New task');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(true);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(false);
		expect(isValidated(context.state, 'tasks[2]')).toBe(false);

		// Test validating an item
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['title', 'My Tasks'],
				['tasks[0]', 'Default task 1'],
				['tasks[1]', 'Default task 2'],
				['tasks[2]', 'New task'],
				[
					DEFAULT_INTENT,
					serializeIntent<ValidateIntent>({
						type: 'validate',
						payload: 'tasks[1]',
					}),
				],
			]),
			ctx,
		});

		expect(getListKey(context, 'tasks')).toEqual([
			'tasks[0]',
			'tasks[1]',
			'1970-01-01T00:00:00.000Z',
		]);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Default task 1',
			'Default task 2',
			'New task',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Default task 1');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('Default task 2');
		expect(getDefaultValue(context, 'tasks[2]')).toBe('New task');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(true);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(true);
		expect(isValidated(context.state, 'tasks[2]')).toBe(false);

		// Test inserting an item at a specific index
		vi.advanceTimersByTime(1);
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['title', 'My Tasks'],
				['tasks[0]', 'Default task 1'],
				['tasks[1]', 'Default task 2'],
				['tasks[2]', 'New task'],
				[
					DEFAULT_INTENT,
					serializeIntent<InsertIntent>({
						type: 'insert',
						payload: {
							name: 'tasks',
							defaultValue: 'Urgent task',
							index: 0,
						},
					}),
				],
			]),
			ctx,
		});

		expect(getListKey(context, 'tasks')).toEqual([
			'1970-01-01T00:00:00.001Z',
			'tasks[0]',
			'tasks[1]',
			'1970-01-01T00:00:00.000Z',
		]);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Urgent task',
			'Default task 1',
			'Default task 2',
			'New task',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Urgent task');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('Default task 1');
		expect(getDefaultValue(context, 'tasks[2]')).toBe('Default task 2');
		expect(getDefaultValue(context, 'tasks[3]')).toBe('New task');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(true);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(false);
		expect(isValidated(context.state, 'tasks[2]')).toBe(true);
		expect(isValidated(context.state, 'tasks[3]')).toBe(false);

		// Test reordering items
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['title', 'My Tasks'],
				['tasks[0]', 'Urgent task'],
				['tasks[1]', 'Default task 1'],
				['tasks[2]', 'Default task 2'],
				['tasks[3]', 'New task'],
				[
					DEFAULT_INTENT,
					serializeIntent<ReorderIntent>({
						type: 'reorder',
						payload: {
							name: 'tasks',
							from: 3,
							to: 1,
						},
					}),
				],
			]),
			ctx,
		});

		expect(getListKey(context, 'tasks')).toEqual([
			'1970-01-01T00:00:00.001Z',
			'1970-01-01T00:00:00.000Z',
			'tasks[0]',
			'tasks[1]',
		]);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Urgent task',
			'New task',
			'Default task 1',
			'Default task 2',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Urgent task');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('New task');
		expect(getDefaultValue(context, 'tasks[2]')).toBe('Default task 1');
		expect(getDefaultValue(context, 'tasks[3]')).toBe('Default task 2');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(true);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(false);
		expect(isValidated(context.state, 'tasks[2]')).toBe(false);
		expect(isValidated(context.state, 'tasks[3]')).toBe(true);

		// Test removing an item
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['title', 'My Tasks'],
				['tasks[0]', 'Urgent task'],
				['tasks[1]', 'New task'],
				['tasks[2]', 'Default task 1'],
				['tasks[3]', 'Default task 2'],
				[
					DEFAULT_INTENT,
					serializeIntent<RemoveIntent>({
						type: 'remove',
						payload: {
							name: 'tasks',
							index: 2,
						},
					}),
				],
			]),
			ctx,
		});

		expect(getListKey(context, 'tasks')).toEqual([
			'1970-01-01T00:00:00.001Z',
			'1970-01-01T00:00:00.000Z',
			'tasks[1]',
		]);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Urgent task',
			'New task',
			'Default task 2',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Urgent task');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('New task');
		expect(getDefaultValue(context, 'tasks[2]')).toBe('Default task 2');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(true);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(false);
		expect(isValidated(context.state, 'tasks[2]')).toBe(true);

		// Test resetting the form
		context.state = updateState(context.state, {
			type: 'client',
			result: createResult([
				['title', 'My Tasks'],
				['tasks[0]', 'Urgent task'],
				['tasks[1]', 'New task'],
				['tasks[2]', 'Default task 2'],
				[
					DEFAULT_INTENT,
					serializeIntent<ResetIntent>({
						type: 'reset',
					}),
				],
			]),
			ctx,
		});

		expect(getListKey(context, 'tasks')).toEqual(['tasks[0]', 'tasks[1]']);
		expect(getDefaultValue(context, 'title')).toBe('My Tasks');
		expect(getDefaultValue(context, 'tasks')).toBe(undefined);
		expect(getDefaultOptions(context, 'tasks')).toEqual([
			'Default task 1',
			'Default task 2',
		]);
		expect(getDefaultValue(context, 'tasks[0]')).toBe('Default task 1');
		expect(getDefaultValue(context, 'tasks[1]')).toBe('Default task 2');
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'title')).toBe(false);
		expect(isValidated(context.state, 'tasks')).toBe(false);
		expect(isValidated(context.state, 'tasks[0]')).toBe(false);
		expect(isValidated(context.state, 'tasks[1]')).toBe(false);
	});
});
