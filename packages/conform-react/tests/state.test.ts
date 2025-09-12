import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { DEFAULT_INTENT_NAME } from '@conform-to/dom/future';
import {
	getDefaultOptions,
	getDefaultValue,
	getErrors,
	getListKey,
	initializeState,
	isTouched,
	updateState,
	isDefaultChecked,
	getDefaultListKey,
	getConstraint,
	getFormMetadata,
	getField,
	getFieldset,
	getFieldList,
} from '../future/state';
import { serializeIntent } from '../future/intent';
import type { FormContext } from '../future/types';
import { createAction } from './helpers';

describe('form', () => {
	function createContext(
		customized?: Partial<FormContext<any>>,
	): FormContext<any> {
		return {
			formId: 'test-id',
			defaultValue: null,
			constraint: null,
			state: initializeState(),
			handleSubmit: vi.fn(),
			handleInput: vi.fn(),
			handleBlur: vi.fn(),
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
						username: ['Username is required'],
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is required',
		]);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);

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
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);

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

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

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
					formErrors: ['Something went wrong'],
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toEqual(['Something went wrong']);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

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

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('my-secret-password');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toEqual(['Something went wrong']);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

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

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('secret-password');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

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
		expect(isTouched(context.state)).toBe(false);
		expect(isTouched(context.state, 'username')).toBe(false);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

		// Test async validation - Setup client error state (1/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', ''],
					['password', ''],
					[
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: ['Username is required'],
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is required',
		]);
		expect(getErrors(context.state, 'password')).toBe(undefined);

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

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('secret-password');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is required',
		]);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);

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
					formErrors: ['Something went wrong'],
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('secret-password');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toEqual(['Something went wrong']);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);
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
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: ['Username is required'],
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is required',
		]);
		expect(getErrors(context.state, 'password')).toBe(undefined);

		// Testing validating another field
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', ''],
					[
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'validate',
							payload: 'password',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: ['Username is invalid'],
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is invalid',
		]);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);

		// Test resetting state with a reset intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
					[
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'reset',
						}),
					],
				],
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(false);
		expect(isTouched(context.state, 'username')).toBe(false);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

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
		expect(isTouched(context.state)).toBe(false);
		expect(isTouched(context.state, 'username')).toBe(false);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

		// Test validating the whole form with async validation - Pre-populate error state (1/4)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', ''],
					[
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'validate',
							payload: 'username',
						}),
					],
				],
				error: {
					fieldErrors: {
						username: ['Username is invalid'],
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is invalid',
		]);
		expect(getErrors(context.state, 'password')).toBe(undefined);

		// Test validating the whole form with async validation - Client Validating (2/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
					[
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'validate',
						}),
					],
				],
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is invalid',
		]);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);

		// Test validating the whole form with async validation - Server Validating (3/3)
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'edmund'],
					['password', 'my-password'],
					[
						DEFAULT_INTENT_NAME,
						serializeIntent({
							type: 'validate',
						}),
					],
				],
				error: {
					formErrors: ['Something went wrong'],
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe(undefined);
		expect(getDefaultValue(context, 'password')).toBe(undefined);
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toEqual(['Something went wrong']);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);
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
		expect(isTouched(context.state)).toBe(false);
		expect(isTouched(context.state, 'username')).toBe(false);
		expect(isTouched(context.state, 'password')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toBe(undefined);

		// Update state with client validation result
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'edmund'],
					['password', 'my-secret-password'],
					[
						DEFAULT_INTENT_NAME,
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
						username: ['Username is invalid'],
						password: ['Password is incorrect'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(false);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is incorrect',
		]);

		// Update state with server error without applying the update intent
		context.state = updateState(
			context.state,
			createAction({
				type: 'server',
				entries: [
					['username', 'example'],
					['password', '*******'],
					[
						DEFAULT_INTENT_NAME,
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
						username: ['Username is invalid'],
						password: ['Password is required'],
					},
				},
			}),
		);

		expect(getDefaultValue(context, 'username')).toBe('edmund');
		expect(getDefaultValue(context, 'password')).toBe('');
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(false);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toBe(undefined);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);

		// Update state with the intent on client side
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'example'],
					['password', '*******'],
					[
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'username')).toBe(true);
		expect(isTouched(context.state, 'password')).toBe(true);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'username')).toEqual([
			'Username is invalid',
		]);
		expect(getErrors(context.state, 'password')).toEqual([
			'Password is required',
		]);
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
		expect(isTouched(context.state)).toBe(false);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(false);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);

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
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(false);

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
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(true);
		expect(isTouched(context.state, 'tasks[2]')).toBe(false);

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
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(true);
		expect(isTouched(context.state, 'tasks[3]')).toBe(false);

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
						DEFAULT_INTENT_NAME,
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
						tasks: ['Too many tasks'],
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(true);
		expect(isTouched(context.state, 'tasks[3]')).toBe(false);
		expect(getErrors(context.state)).toBe(undefined);
		expect(getErrors(context.state, 'tasks')).toEqual(['Too many tasks']);
		expect(getErrors(context.state, 'tasks[0]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[1]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[2]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[3]')).toBe(undefined);

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
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(false);
		expect(isTouched(context.state, 'tasks[3]')).toBe(true);

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
						DEFAULT_INTENT_NAME,
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
					formErrors: ['Some tasks are too urgent'],
					fieldErrors: {
						'tasks[0]': ['The task is too urgent'],
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(false);
		expect(isTouched(context.state, 'tasks[3]')).toBe(true);
		expect(getErrors(context.state)).toEqual(['Some tasks are too urgent']);
		expect(getErrors(context.state, 'tasks')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[0]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[1]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[2]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[3]')).toBe(undefined);

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
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(true);

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
						DEFAULT_INTENT_NAME,
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
					formErrors: ['Oops'],
					fieldErrors: {
						'tasks[0]': ['This task is too urgent'],
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
		expect(isTouched(context.state)).toBe(true);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(true);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
		expect(isTouched(context.state, 'tasks[2]')).toBe(true);
		expect(getErrors(context.state)).toEqual(['Oops']);
		expect(getErrors(context.state, 'tasks')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[0]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[1]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[2]')).toBe(undefined);
		expect(getErrors(context.state, 'tasks[3]')).toBe(undefined);

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
						DEFAULT_INTENT_NAME,
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
		expect(isTouched(context.state)).toBe(false);
		expect(isTouched(context.state, 'title')).toBe(false);
		expect(isTouched(context.state, 'tasks')).toBe(false);
		expect(isTouched(context.state, 'tasks[0]')).toBe(false);
		expect(isTouched(context.state, 'tasks[1]')).toBe(false);
	});

	test('isDefaultChecked', () => {
		// Test with boolean checkbox values
		const context = createContext({
			defaultValue: {
				subscribe: true,
				notifications: false,
			},
		});

		expect(isDefaultChecked(context, 'subscribe')).toBe(true);
		expect(isDefaultChecked(context, 'notifications')).toBe(false);

		// Test with 'on' value (checkbox default)
		const contextWithOn = createContext({
			defaultValue: {
				subscribe: 'on',
				notifications: '',
			},
		});

		expect(isDefaultChecked(contextWithOn, 'subscribe')).toBe(true);
		expect(isDefaultChecked(contextWithOn, 'notifications')).toBe(false);

		// Test with undefined/missing values
		expect(isDefaultChecked(createContext(), 'missing')).toBe(false);
	});

	test('getDefaultListKey', () => {
		const prefix = 'test-prefix';
		const initialValue = {
			items: ['item1', 'item2', 'item3'],
			nested: {
				list: ['a', 'b'],
			},
		};

		// Test simple array
		expect(getDefaultListKey(prefix, initialValue, 'items')).toEqual([
			'test-prefix-items[0]',
			'test-prefix-items[1]',
			'test-prefix-items[2]',
		]);

		// Test nested array
		expect(getDefaultListKey(prefix, initialValue, 'nested.list')).toEqual([
			'test-prefix-nested.list[0]',
			'test-prefix-nested.list[1]',
		]);

		// Test empty array
		expect(getDefaultListKey(prefix, { empty: [] }, 'empty')).toEqual([]);

		// Test non-existent field
		expect(getDefaultListKey(prefix, initialValue, 'missing')).toEqual([]);
	});

	test('getConstraint', () => {
		const context = createContext({
			constraint: {
				username: { required: true, minLength: 3 },
				'items[]': { required: true },
				'items[].subitems[].name': { maxLength: 50 },
			},
		});

		// Test direct constraint match
		expect(getConstraint(context, 'username')).toEqual({
			required: true,
			minLength: 3,
		});

		// Test array fallback: items[0] should fall back to items[]
		expect(getConstraint(context, 'items[0]')).toEqual({ required: true });

		// Test nested array fallback: items[0].subitems[].name should fall back toitems[].subitems[].name
		expect(getConstraint(context, 'items[0].subitems[].name')).toEqual({
			maxLength: 50,
		});

		// Test nested array fallback: items[0].subitems[1].name should fall back toitems[].subitems[].name as well
		expect(getConstraint(context, 'items[0].subitems[1].name')).toEqual({
			maxLength: 50,
		});

		// Test no fallback available
		expect(getConstraint(context, 'missing')).toBe(undefined);

		// Test no constraints defined
		expect(getConstraint(createContext(), 'any')).toBe(undefined);
	});

	test('getFormMetadata', () => {
		const context = createContext({
			defaultValue: { username: 'test' },
		});

		// Add some touched fields and errors
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [['username', '']],
				error: {
					formErrors: ['Form error'],
					fieldErrors: {
						username: ['Username required'],
						password: ['Password required'],
					},
				},
			}),
		);

		const metadata = getFormMetadata(context, {
			serialize: (value) => value?.toString(),
		});

		// Test basic properties
		expect(metadata.id).toBe('test-id');
		expect(metadata.key).toBe(context.state.resetKey);
		expect(metadata.errorId).toBe('test-id-form-error');
		expect(metadata.descriptionId).toBe('test-id-form-description');
		expect(metadata.errors).toEqual(['Form error']);
		expect(metadata.fieldErrors).toEqual({
			username: ['Username required'],
			password: ['Password required'],
		});
		expect(metadata.touched).toBe(true);
		expect(metadata.valid).toBe(false);
		expect(metadata.invalid).toBe(true);

		// Test props
		expect(metadata.props.id).toBe('test-id');
		expect(metadata.props.onSubmit).toBe(context.handleSubmit);
		expect(metadata.props.noValidate).toBe(true);

		// Test methods exist
		expect(typeof metadata.getField).toBe('function');
		expect(typeof metadata.getFieldset).toBe('function');
		expect(typeof metadata.getFieldList).toBe('function');

		// Test hierarchical validation: form should be invalid when child fields have errors
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['profile.name', 'John'],
					['profile.age', '15'],
				],
				error: {
					fieldErrors: {
						'profile.age': ['Age must be 18+'],
					},
				},
			}),
		);

		const formWithNestedErrors = getFormMetadata(context, {
			serialize: (value) => value?.toString(),
		});

		// Form should be invalid due to nested field errors, even with no direct form errors
		expect(formWithNestedErrors.errors).toBe(undefined); // No direct form errors
		expect(formWithNestedErrors.valid).toBe(false); // But form is still invalid
		expect(formWithNestedErrors.invalid).toBe(true);
		expect(formWithNestedErrors.fieldErrors).toEqual({
			'profile.age': ['Age must be 18+'],
		});

		// Test form becomes valid when all nested errors are resolved
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['profile.name', 'John Smith'],
					['profile.age', '25'],
				],
				error: null,
			}),
		);

		const validForm = getFormMetadata(context, {
			serialize: (value) => value?.toString(),
		});

		expect(validForm.errors).toBe(undefined);
		expect(validForm.valid).toBe(true);
		expect(validForm.invalid).toBe(false);
		expect(validForm.fieldErrors).toEqual({});
	});

	test('getField', () => {
		const context = createContext({
			defaultValue: {
				username: 'test-user',
				profile: { age: 25 },
				tags: ['react', 'typescript'],
			},
			constraint: {
				username: { required: true, minLength: 3 },
			},
		});

		// Add touched field
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [['username', 'test-user']],
				error: {
					fieldErrors: {
						username: ['Username taken'],
					},
				},
			}),
		);

		const field = getField(context, {
			name: 'username',
			key: 'unique-key',
			serialize: (value) => String(value),
		});

		// Test basic properties
		expect(field.id).toBe('test-id-field-username');
		expect(field.name).toBe('username');
		expect(field.key).toBe('unique-key');
		expect(field.descriptionId).toBe('test-id-field-username-description');
		expect(field.errorId).toBe('test-id-field-username-error');
		expect(field.formId).toBe('test-id');

		// Test constraint properties
		expect(field.required).toBe(true);
		expect(field.minLength).toBe(3);

		// Test computed properties
		expect(field.defaultValue).toBe('test-user');
		expect(field.touched).toBe(true);
		expect(field.valid).toBe(false);
		expect(field.invalid).toBe(true);
		expect(field.errors).toEqual(['Username taken']);
		expect(field.fieldErrors).toEqual({}); // No child fields, so empty

		// Test mixed parent and child field errors
		context.state = updateState(
			context.state,
			createAction({
				type: 'client',
				entries: [
					['username', 'test-user'],
					['profile.age', '25'],
				],
				error: {
					fieldErrors: {
						username: ['Username taken'],
						'profile.age': ['Age must be 18+'],
					},
				},
			}),
		);

		const profileField = getField(context, {
			name: 'profile',
			serialize: (value) => String(value),
		});

		// Profile field should be invalid due to child field error, even though it has no direct error
		expect(profileField.valid).toBe(false);
		expect(profileField.invalid).toBe(true);
		expect(profileField.errors).toBe(undefined); // No direct error on profile
		expect(profileField.fieldErrors).toEqual({
			age: ['Age must be 18+'], // Child field error
		});

		// Test methods exist
		expect(typeof field.getFieldset).toBe('function');
		expect(typeof field.getFieldList).toBe('function');
	});

	test('getFieldset', () => {
		const context = createContext({
			defaultValue: {
				profile: {
					name: 'John',
					email: 'john@example.com',
					nested: {
						value: 'deep',
					},
				},
			},
		});

		const fieldset = getFieldset(context, {
			name: 'profile',
			serialize: (value) => String(value),
		});

		// Test dynamic property access via Proxy
		const nameField = fieldset.name!;
		expect(nameField.name).toBe('profile.name');
		expect(nameField.defaultValue).toBe('John');
		expect(nameField.id).toBe('test-id-field-profile.name');

		const emailField = fieldset.email!;
		expect(emailField.name).toBe('profile.email');
		expect(emailField.defaultValue).toBe('john@example.com');

		// Test nested access
		const nestedFieldset = fieldset.nested!;
		expect(nestedFieldset.name).toBe('profile.nested');
		const deepField = (nestedFieldset.getFieldset() as any).value;
		expect(deepField.name).toBe('profile.nested.value');
		expect(deepField.defaultValue).toBe('deep');

		// Test root fieldset (no name)
		const rootFieldset = getFieldset(context, {
			serialize: (value) => String(value),
		});
		const profileField = rootFieldset.profile!;
		expect(profileField.name).toBe('profile');
	});

	test('getFieldList', () => {
		const context = createContext({
			defaultValue: {
				tags: ['react', 'typescript', 'testing'],
				users: [
					{ name: 'John', age: 25 },
					{ name: 'Jane', age: 30 },
				],
			},
		});

		// Mock list keys
		context.state.listKeys = {
			tags: ['key1', 'key2', 'key3'],
			users: ['user1', 'user2'],
		};

		// Test simple array
		const tagFields = getFieldList(context, {
			name: 'tags',
			serialize: (value) => String(value),
		});

		expect(tagFields).toHaveLength(3);
		expect(tagFields[0]?.name).toBe('tags[0]');
		expect(tagFields[0]?.key).toBe('key1');
		expect(tagFields[0]?.defaultValue).toBe('react');
		expect(tagFields[1]?.name).toBe('tags[1]');
		expect(tagFields[1]?.key).toBe('key2');
		expect(tagFields[1]?.defaultValue).toBe('typescript');

		// Test object array
		const userFields = getFieldList(context, {
			name: 'users',
			serialize: (value) => String(value),
		});

		expect(userFields).toHaveLength(2);
		expect(userFields[0]?.name).toBe('users[0]');
		expect(userFields[0]?.key).toBe('user1');
		expect(userFields[1]?.name).toBe('users[1]');
		expect(userFields[1]?.key).toBe('user2');

		// Test accessing nested fields in object array
		const firstUserFieldset = userFields[0]?.getFieldset();
		expect(firstUserFieldset?.name?.name).toBe('users[0].name');
		expect(firstUserFieldset?.name?.defaultValue).toBe('John');
		expect(firstUserFieldset?.age?.name).toBe('users[0].age');
		expect(firstUserFieldset?.age?.defaultValue).toBe('25');
	});
});
