import { expect, test } from 'vitest';
import {
	defaultSerialize,
	getDefaultValue,
	getError,
	isTouched,
} from './metadata';

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
	expect(defaultSerialize(value)).toEqual(undefined);
	expect(defaultSerialize(value.string)).toEqual(result.string);
	expect(defaultSerialize(value.array)).toEqual(result.array);
	expect(defaultSerialize(value.mixed)).toEqual(result.mixed);
	expect(defaultSerialize(value.date)).toEqual(result.date);
	expect(defaultSerialize(value.boolean)).toEqual(result.boolean);
	expect(defaultSerialize(value.number)).toEqual(result.number);
	expect(defaultSerialize(value.bigint)).toEqual(result.bigint);
	expect(defaultSerialize(value.regexp)).toEqual(result.regexp);
});

test('getDefaultValue()', () => {
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

	expect(getDefaultValue(value, 'date')).toEqual('today');
	expect(getDefaultValue(value, 'tasks[0].title')).toEqual('test');
	expect(getDefaultValue(value, 'tasks[0].by')).toEqual(['Tom', 'Mary']);

	// should get values as string or string[] only
	expect(getDefaultValue(value, '')).toEqual(undefined);
	expect(getDefaultValue(value, 'tasks')).toEqual(undefined);
	expect(getDefaultValue(value, 'tasks[0]')).toEqual(undefined);
	expect(getDefaultValue(undefined, 'count')).toEqual(undefined);

	// should return undefined if no such paths
	expect(getDefaultValue(value, 'tasks[0].deadline')).toEqual(undefined);

	// number values should be serialized
	expect(getDefaultValue(value, 'count')).toEqual('1');
	expect(getDefaultValue(value, 'tasks[0].workingHour')).toEqual(['1', '2']);

	// serialize cases
	expect(getDefaultValue(value, 'count', () => 'i')).toEqual('i');
	expect(
		getDefaultValue(value, 'tasks[0].workingHour', (value) =>
			value?.toString(),
		),
	).toEqual('1,2');
	expect(getDefaultValue(value, 'count', () => undefined)).toEqual(undefined);
	expect(getDefaultValue(value, 'tasks[0].workingHour', () => [])).toEqual([]);
});

test('isTouched()', () => {
	const touchedFields = [
		'email',
		'tasks[0]',
		'tasks[0].title',
		'tasks[2].title',
		'address.city',
	];

	expect(isTouched(touchedFields, '')).toEqual(true);
	expect(isTouched(touchedFields, 'email')).toEqual(true);
	expect(isTouched(touchedFields, 'tasks[0].title')).toEqual(true);
	expect(isTouched(touchedFields, 'tasks[1]')).toEqual(false);
	expect(isTouched(touchedFields, 'tasks[2]')).toEqual(true);
	expect(isTouched(touchedFields, 'tasks')).toEqual(true);
	expect(isTouched(touchedFields, 'address')).toEqual(true);
	expect(isTouched(touchedFields, 'address.city')).toEqual(true);
	expect(isTouched(touchedFields, 'address.country')).toEqual(false);
	expect(isTouched(touchedFields)).toEqual(true);
	expect(isTouched([], '')).toEqual(false);
	expect(isTouched([], 'email')).toEqual(false);
	expect(isTouched([])).toEqual(false);
});

test('getError()', () => {
	const error = {
		formError: ['Invalid fields exist', 'Incompleted form'],
		fieldError: {
			email: ['Invalid email'],
		},
	};
	const noFormError = {
		formError: null,
		fieldError: {
			email: 'Invalid email',
		},
	};
	const touchedFields = ['email', 'address.city'];

	expect(getError(error, touchedFields, 'password')).toEqual(undefined);
	expect(getError(error, [], 'password')).toEqual(undefined);
	expect(getError(error, touchedFields, 'address.city')).toEqual(undefined);
	expect(getError(error, touchedFields, 'email')).toEqual(
		error.fieldError.email,
	);
	expect(getError(error, touchedFields, '')).toEqual(error.formError);
	expect(getError(error, touchedFields)).toEqual(error.formError);
	expect(getError(noFormError, touchedFields, '')).toEqual(undefined);
	expect(getError(noFormError, touchedFields)).toEqual(undefined);
	expect(getError(null, touchedFields, '')).toEqual(undefined);
	expect(getError(null, touchedFields, 'email')).toEqual(undefined);
});
