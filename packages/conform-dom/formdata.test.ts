import { test, expect } from 'vitest';
import { getPaths, formatPaths, setValue, getValue } from './formdata';

test('getPaths()', () => {
	expect(getPaths(undefined)).toEqual([]);
	expect(getPaths('')).toEqual([]);
	expect(getPaths('title')).toEqual(['title']);
	expect(getPaths('123')).toEqual(['123']);
	expect(getPaths('amount.currency')).toEqual(['amount', 'currency']);
	expect(getPaths('[0]')).toEqual([0]);
	expect(getPaths('tasks[0]')).toEqual(['tasks', 0]);
	expect(getPaths('tasks[1].completed')).toEqual(['tasks', 1, 'completed']);
	expect(getPaths('tasks.stage[0]')).toEqual(['tasks', 'stage', 0]);
	expect(getPaths('multiple[0][1][2]')).toEqual(['multiple', 0, 1, 2]);
	expect(getPaths('books[0].chapters[1]')).toEqual(['books', 0, 'chapters', 1]);

	// Special field name
	expect(getPaths('multiple[5].[1].abc')).toEqual(['multiple', 5, 1, 'abc']);
	expect(getPaths('multiple[5][1]abc')).toEqual(['multiple', 5, 1, 'abc']);
	expect(getPaths('multiple(5)_abc')).toEqual(['multiple(5)_abc']);
});

test('formatPaths()', () => {
	expect(formatPaths([])).toEqual('');
	expect(formatPaths([0])).toEqual('[0]');
	expect(formatPaths(['title'])).toEqual('title');
	expect(formatPaths(['amount', 'currency'])).toEqual('amount.currency');
	expect(formatPaths(['tasks', 0])).toEqual('tasks[0]');
	expect(formatPaths(['tasks', 1, 'completed'])).toEqual('tasks[1].completed');
});

test('setValue()', () => {
	const emptyFile = new File([], 'example.txt');
	const emptyFile2 = new File([], 'example2.txt');

	// simple update string to string and
	// only one value is set, not affect other fields
	expect(
		setValue(
			{
				email: 'abc@test.com',
				password: 3028940,
				file: emptyFile,
				tasks: [
					{
						stage: ['planning'],
					},
				],
			},
			['email'],
			'false@emailformat',
		),
	).toEqual({
		email: 'false@emailformat',
		password: 3028940,
		file: emptyFile,
		tasks: [
			{
				stage: ['planning'],
			},
		],
	});

	// delete a value
	expect(
		setValue(
			{
				file: emptyFile,
			},
			['file'],
			undefined,
		),
	).toEqual({
		file: undefined,
	});

	// replace to new array
	expect(
		setValue(
			{
				file: [emptyFile, emptyFile2],
			},
			['file'],
			['hiddenFile', emptyFile],
		),
	).toEqual({
		file: ['hiddenFile', emptyFile],
	});

	// boolean to array
	expect(
		setValue(
			{
				radioButton: true,
			},
			['radioButton'],
			[false],
		),
	).toEqual({
		radioButton: [false],
	});

	// add new object to a nested structure
	expect(
		setValue(
			{
				tasks: [
					{
						stage: ['planning'],
					},
				],
			},
			['tasks', 0, 'stage', 2, 'status'],
			'completed',
		),
	).toEqual({
		tasks: [
			{
				stage: ['planning', undefined, { status: 'completed' }],
			},
		],
	});

	// using currentValue
	expect(
		setValue(
			{
				count: 3028940,
			},
			['count'],
			(currentValue: number) => currentValue - 28940,
		),
	).toEqual({
		count: 3000000,
	});

	// data should be mutated
	const data1 = {};
	expect(setValue(data1, ['email'], 'abc@test.com')).toBe(data1);
	expect(data1).toEqual({ email: 'abc@test.com' });

	// handle -> shallowclone
	const data2 = {};
	const result2 = setValue(data2, ['email'], 'abc@test.com', { clone: true });
	expect(data2).toEqual({});
	expect(result2).not.toBe(data2);
	expect(result2).toEqual({ email: 'abc@test.com' });
});

test('getValue()', () => {
	const file1 = new File([], 'example.txt');
	const file2 = new File([], 'example2.txt');
	const target = {
		email: 'hello@world.com',
		password: undefined,
		lastLogin: null,
		task: [
			'taskname0',
			{
				stage: ['in progress'],
			},
		],
		file: [file1, file2],
		objs: { level1: { level2: 'content' } },
	};

	expect(getValue(target, ['email'])).toEqual(target.email);
	expect(getValue(target, ['task'])).toEqual(target.task);
	expect(getValue(target, ['task', 1, 'stage', 0])).toEqual(
		// @ts-expect-error
		target.task[1].stage[0],
	);
	expect(getValue(target, ['file', 1])).toEqual(target.file[1]);
	expect(getValue(target, ['objs', 'level1'])).toEqual(target.objs.level1);
	expect(getValue(target, ['objs', 'level1', 'level2'])).toEqual(
		target.objs.level1.level2,
	);
	expect(getValue(target, ['password'])).toEqual(undefined);
	expect(getValue(target, ['lastLogin'])).toEqual(null);
	expect(getValue(target, ['expiry'])).toEqual(undefined);
	expect(getValue(target, ['file', 3])).toEqual(undefined);
	expect(getValue(target, ['objs', 'level1', 'level2', 'level3'])).toEqual(
		undefined,
	);
	expect(getValue(undefined, ['email'])).toEqual(undefined);
	expect(getValue(target, [])).toEqual(target);
	expect(getValue(target, [0])).toEqual(undefined);
	expect(getValue(target, [NaN])).toEqual(undefined);
	expect(getValue(target.file, [0])).toEqual(target.file[0]);
});
