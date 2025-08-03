import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { initializeState, serializeIntent, updateState } from '../future/form';
import {
	getDefaultOptions,
	getDefaultValue,
	getError,
	getListKey,
	isValidated,
} from '../future/metadata';
import { DEFAULT_INTENT } from '../future/hooks';
import { FormContext } from '../future/types';
import { createAction } from './helpers';

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

	beforeAll(() => {
		vi.spyOn(Math, 'random').mockReturnValue(1);
		vi.useFakeTimers({ now: 0 });
	});

	afterAll(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	test('default submission', () => {
		const context = createContext();

		// Test client validation with empty fields
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', ''],
					['password', ''],
				],
				error: {
					fieldErrors: {
						username: 'Username is required',
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is required');
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test client validation with valid username
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', ''],
				],
				error: {
					fieldErrors: {
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test client validation with no errors
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-secret-password'],
				],
				error: null,
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test server validation
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'edmund'],
					['password', 'my-secret-password'],
				],
				error: {
					formErrors: 'Something went wrong',
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe('Something went wrong');
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test client validation with the same form value after server validation
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-secret-password'],
				],
				error: null,
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe('Something went wrong');
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test client validation with the form value updated after server validation
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'secret-password'],
				],
				error: null,
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test server validation with a reset result
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'edmund'],
					['password', 'secret-password'],
				],
				value: null,
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test async validation - Setup client error state (1/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', ''],
					['password', ''],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: 'Username is required',
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is required');
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test async validation - Client validation result (2/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'secret-password'],
				],
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is required');
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test async validation - Server validation result (3/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'edmund'],
					['password', 'secret-password'],
				],
				error: {
					formErrors: 'Something went wrong',
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe('Something went wrong');
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);
	});

	test('validate fields', () => {
		const context = createContext();

		// Test validating one field
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', ''],
					['password', ''],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: 'Username is required',
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is required');
		expect(getError(context.state, 'password')).toBe(undefined);

		// Testing validating another field
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', ''],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
							payload: 'password',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: 'Username is invalid',
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is invalid');
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test resetting state with a reset intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'reset',
						}),
					],
				],
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test resetting form with null value
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
				],
				value: null,
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(false);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test validating the whole form with async validation - Pre-populate error state (1/4)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', ''],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: 'Username is invalid',
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(false);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is invalid');
		expect(getError(context.state, 'password')).toBe(undefined);

		// Test validating the whole form with async validation - Client Validating (2/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
						}),
					],
				],
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe('Username is invalid');
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Test validating the whole form with async validation - Server Validating (3/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
						}),
					],
				],
				error: {
					formErrors: 'Something went wrong',
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe('Something went wrong');
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);
	});

	test('update fields', () => {
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
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe(undefined);

		// Update state with client validation result
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-secret-password'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'update',
							payload: {
								name: 'password',
								value: '',
							},
						}),
					],
				],
				error: {
					fieldErrors: {
						username: 'Username is invalid',
						password: 'Password is incorrect',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe('Password is incorrect');

		// Update state with server error without applying the update intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'example'],
					['password', '*******'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'update',
							payload: {
								name: '',
								value: {
									username: 'edmund',
									password: '',
								},
							},
						}),
					],
				],
				error: {
					fieldErrors: {
						username: 'Username is invalid',
						password: 'Password is required',
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(false);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'username')).toBe(undefined);
		expect(getError(context.state, 'password')).toBe('Password is required');

		// Update state with the intent on client side
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'example'],
					['password', '*******'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'update',
							payload: {
								name: '',
								value: {
									username: 'edmund',
									password: '',
								},
							},
						}),
					],
				],
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isValidated(context.state)).toBe(true);
		expect(isValidated(context.state, 'username')).toBe(true);
		expect(isValidated(context.state, 'password')).toBe(true);
		expect(getError(context.state)).toBe(undefined);
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

		expect(getListKey(context, 'tasks')).toEqual(['0-tasks[0]', '0-tasks[1]']);
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
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Default task 1'],
					['tasks[1]', 'Default task 2'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'insert',
							payload: {
								name: 'tasks',
								defaultValue: 'New task',
							},
						}),
					],
				],
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual([
			'0-tasks[0]',
			'0-tasks[1]',
			'0',
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
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Default task 1'],
					['tasks[1]', 'Default task 2'],
					['tasks[2]', 'New task'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'validate',
							payload: 'tasks[1]',
						}),
					],
				],
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual([
			'0-tasks[0]',
			'0-tasks[1]',
			'0',
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
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Default task 1'],
					['tasks[1]', 'Default task 2'],
					['tasks[2]', 'New task'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'insert',
							payload: {
								name: 'tasks',
								defaultValue: 'Urgent task',
								index: 0,
							},
						}),
					],
				],
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual([
			'1',
			'0-tasks[0]',
			'0-tasks[1]',
			'0',
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

		// Test whether client async validation will skip applying the insert intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Urgent task'],
					['tasks[1]', 'Default task 1'],
					['tasks[2]', 'Default task 2'],
					['tasks[3]', 'New task'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'insert',
							payload: {
								name: 'tasks',
								defaultValue: 'Urgent task',
								index: 0,
							},
						}),
					],
				],
				error: {
					fieldErrors: {
						tasks: 'Too many tasks',
					},
				},
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual([
			'1',
			'0-tasks[0]',
			'0-tasks[1]',
			'0',
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
		expect(getError(context.state)).toBe(undefined);
		expect(getError(context.state, 'tasks')).toBe('Too many tasks');
		expect(getError(context.state, 'tasks[0]')).toBe(undefined);
		expect(getError(context.state, 'tasks[1]')).toBe(undefined);
		expect(getError(context.state, 'tasks[2]')).toBe(undefined);
		expect(getError(context.state, 'tasks[3]')).toBe(undefined);

		// Test reordering items
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Urgent task'],
					['tasks[1]', 'Default task 1'],
					['tasks[2]', 'Default task 2'],
					['tasks[3]', 'New task'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'reorder',
							payload: {
								name: 'tasks',
								from: 3,
								to: 1,
							},
						}),
					],
				],
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual([
			'1',
			'0',
			'0-tasks[0]',
			'0-tasks[1]',
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

		// Test whether client async validation will skip applying the reorder intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Urgent task'],
					['tasks[1]', 'Default task 1'],
					['tasks[2]', 'Default task 2'],
					['tasks[3]', 'New task'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'reorder',
							payload: {
								name: 'tasks',
								from: 3,
								to: 1,
							},
						}),
					],
				],
				error: {
					formErrors: 'Some tasks are too urgent',
					fieldErrors: {
						'tasks[0]': 'The task is too urgent',
					},
				},
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual([
			'1',
			'0',
			'0-tasks[0]',
			'0-tasks[1]',
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
		expect(getError(context.state)).toBe('Some tasks are too urgent');
		expect(getError(context.state, 'tasks')).toBe(undefined);
		expect(getError(context.state, 'tasks[0]')).toBe(undefined);
		expect(getError(context.state, 'tasks[1]')).toBe(undefined);
		expect(getError(context.state, 'tasks[2]')).toBe(undefined);
		expect(getError(context.state, 'tasks[3]')).toBe(undefined);

		// Test removing an item
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Urgent task'],
					['tasks[1]', 'New task'],
					['tasks[2]', 'Default task 1'],
					['tasks[3]', 'Default task 2'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'remove',
							payload: {
								name: 'tasks',
								index: 2,
							},
						}),
					],
				],
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual(['1', '0', '0-tasks[1]']);
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

		// Test whether client async validation will skip applying the remove intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Urgent task'],
					['tasks[1]', 'New task'],
					['tasks[2]', 'Default task 1'],
					['tasks[3]', 'Default task 2'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'remove',
							payload: {
								name: 'tasks',
								index: 2,
							},
						}),
					],
				],
				error: {
					formErrors: 'Oops',
					fieldErrors: {
						'tasks[0]': 'This task is too urgent',
					},
				},
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual(['1', '0', '0-tasks[1]']);
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
		expect(getError(context.state)).toBe('Oops');
		expect(getError(context.state, 'tasks')).toBe(undefined);
		expect(getError(context.state, 'tasks[0]')).toBe(undefined);
		expect(getError(context.state, 'tasks[1]')).toBe(undefined);
		expect(getError(context.state, 'tasks[2]')).toBe(undefined);
		expect(getError(context.state, 'tasks[3]')).toBe(undefined);

		// Test resetting the form
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['title', 'My Tasks'],
					['tasks[0]', 'Urgent task'],
					['tasks[1]', 'New task'],
					['tasks[2]', 'Default task 2'],
					[
						DEFAULT_INTENT,
						serializeIntent({
							type: 'reset',
						}),
					],
				],
			}),
		);

		expect(getListKey(context, 'tasks')).toEqual(['1-tasks[0]', '1-tasks[1]']);
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
