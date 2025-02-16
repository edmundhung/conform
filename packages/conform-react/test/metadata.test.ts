import { expect, test } from 'vitest';
import {
	serialize,
	getSerializedValue,
	getError,
	isTouched,
} from '../src/metadata';

const defaultState = {
	initialValue: null,
	submittedValue: null,
	serverError: null,
	clientError: null,
	touchedFields: [],
	keys: {},
	custom: {},
};

test('defaultSerialize()', () => {
	const value = {
		string: 'abc',
		array: [1, 2, 3],
		mixed: [0, false],
		date: new Date(0),
		boolean: true,
		number: 10,
		bigint: 1n,
		regexp: /[0-9]/,
	};
	const result = {
		string: 'abc',
		array: ['1', '2', '3'],
		mixed: undefined,
		date: '1970-01-01T00:00:00.000Z',
		boolean: 'on',
		number: '10',
		bigint: '1',
		regexp: '/[0-9]/',
	};
	expect(serialize(value)).toEqual(undefined);
	expect(serialize(value.string)).toEqual(result.string);
	expect(serialize(value.array)).toEqual(result.array);
	expect(serialize(value.mixed)).toEqual(result.mixed);
	expect(serialize(value.date)).toEqual(result.date);
	expect(serialize(value.boolean)).toEqual(result.boolean);
	expect(serialize(value.number)).toEqual(result.number);
	expect(serialize(value.bigint)).toEqual(result.bigint);
	expect(serialize(value.regexp)).toEqual(result.regexp);
});

test('getSerializedValue()', () => {
	const value = {
		date: 'today',
		count: 1,
		tasks: [
			{
				title: 'test',
				by: ['Tom', 'Mary'],
				workingHour: [1, 2],
			},
		],
	};

	expect(getSerializedValue(value, 'date')).toEqual('today');
	expect(getSerializedValue(value, 'tasks[0].title')).toEqual('test');
	expect(getSerializedValue(value, 'tasks[0].by')).toEqual(['Tom', 'Mary']);

	// should get values as string or string[] only
	expect(getSerializedValue(value, '')).toEqual(undefined);
	expect(getSerializedValue(value, 'tasks')).toEqual(undefined);
	expect(getSerializedValue(value, 'tasks[0]')).toEqual(undefined);
	expect(getSerializedValue(undefined, 'count')).toEqual(undefined);

	// should return undefined if no such paths
	expect(getSerializedValue(value, 'tasks[0].deadline')).toEqual(undefined);

	// number values should be serialized
	expect(getSerializedValue(value, 'count')).toEqual('1');
	expect(getSerializedValue(value, 'tasks[0].workingHour')).toEqual(['1', '2']);

	// serialize cases
	expect(getSerializedValue(value, 'count', () => 'i')).toEqual('i');
	expect(
		getSerializedValue(value, 'tasks[0].workingHour', (value) =>
			value?.toString(),
		),
	).toEqual('1,2');
	expect(getSerializedValue(value, 'count', () => undefined)).toEqual(
		undefined,
	);
	expect(getSerializedValue(value, 'tasks[0].workingHour', () => [])).toEqual(
		[],
	);
});

test('isTouched()', () => {
	const state = {
		...defaultState,
		touchedFields: [
			'email',
			'tasks[0]',
			'tasks[0].title',
			'tasks[2].title',
			'address.city',
		],
	};

	expect(isTouched(state, '')).toEqual(true);
	expect(isTouched(state, 'email')).toEqual(true);
	expect(isTouched(state, 'tasks[0].title')).toEqual(true);
	expect(isTouched(state, 'tasks[1]')).toEqual(false);
	expect(isTouched(state, 'tasks[2]')).toEqual(true);
	expect(isTouched(state, 'tasks')).toEqual(true);
	expect(isTouched(state, 'address')).toEqual(true);
	expect(isTouched(state, 'address.city')).toEqual(true);
	expect(isTouched(state, 'address.country')).toEqual(false);
	expect(isTouched(state)).toEqual(true);
	expect(isTouched(state, '')).toEqual(false);
	expect(isTouched(state, 'email')).toEqual(false);
	expect(isTouched(state)).toEqual(false);
});

test('getError()', () => {
	const error = {
		formErrors: ['Invalid fields exist', 'Incompleted form'],
		fieldErrors: {
			email: ['Invalid email'],
		},
	};
	const noformErrors = {
		formErrors: null,
		fieldErrors: {
			email: 'Invalid email',
		},
	};
	const touchedFields = ['email', 'address.city'];

	expect(
		getError(
			{ ...defaultState, clientError: error, touchedFields },
			'password',
		),
	).toEqual(undefined);
	expect(getError({ ...defaultState, clientError: error }, 'password')).toEqual(
		undefined,
	);
	expect(
		getError(
			{ ...defaultState, clientError: error, touchedFields },
			'address.city',
		),
	).toEqual(undefined);
	expect(
		getError({ ...defaultState, clientError: error, touchedFields }, 'email'),
	).toEqual(error.fieldErrors.email);
	expect(
		getError({ ...defaultState, clientError: error, touchedFields }, ''),
	).toEqual(error.formErrors);
	expect(
		getError({ ...defaultState, clientError: error, touchedFields }),
	).toEqual(error.formErrors);
	expect(
		getError({ ...defaultState, clientError: noformErrors, touchedFields }, ''),
	).toEqual(undefined);
	expect(
		getError({ ...defaultState, clientError: noformErrors, touchedFields }),
	).toEqual(undefined);
	expect(getError({ ...defaultState, touchedFields }, '')).toEqual(undefined);
	expect(getError({ ...defaultState, touchedFields }, 'email')).toEqual(
		undefined,
	);
});
