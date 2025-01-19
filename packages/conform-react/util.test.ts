import { test, expect } from 'vitest';
import {
	mergeObjects,
	flatten,
	addItems,
	configureListIndexUpdate,
	mapItems,
	mapKeys,
} from './util';

test('mergeObjects()', () => {
	// merge for string, different data types, list, new object, undefined, null
	const obj1 = {
		email: 'tom@test.com',
		lastLogin: 'Tuesday',
		tasks: {
			task1: 'buy coffee bean',
			budget: undefined,
			amount: null,
			note: undefined,
			by: ['Tom'],
		},
		counts: [1, 3, 5],
	};
	const obj2 = {
		email: 'mary@test.com',
		lastLogin: 2103,
		tasks: {
			task1: 'buy coffee bean',
			task2: 'make coffee',
			// Undefined value will be skipped
			task3: undefined,
			spend: null,
			note: 'prefer medium roasted',
			by: ['Tom', 'Mary'],
		},
		counts: [2],
	};

	// overwrite is true
	// @ts-expect-error
	expect(mergeObjects(obj1, obj2, true)).toEqual({
		email: 'mary@test.com',
		lastLogin: 2103,
		tasks: {
			task1: 'buy coffee bean',
			task2: 'make coffee',
			budget: undefined,
			amount: null,
			spend: null,
			note: 'prefer medium roasted',
			by: ['Tom', 'Mary'],
		},
		counts: [2],
	});

	// overwrite is false
	// @ts-expect-error
	expect(mergeObjects(obj1, obj2, false)).toEqual({
		email: 'tom@test.com',
		lastLogin: 'Tuesday',
		tasks: {
			task1: 'buy coffee bean',
			task2: 'make coffee',
			budget: undefined,
			amount: null,
			spend: null,
			note: undefined,
			by: ['Tom', 'Mary'],
		},
		counts: [2],
	});

	// No mutation if no changes
	const obj3 = { email: 'abc@test.com', lastLogin: 'Webnesday' };
	expect(mergeObjects(obj1, obj3, false)).toBe(obj1);

	const obj4 = { email: 'tom@test.com', lastLogin: 'Tuesday' };
	expect(mergeObjects(obj1, obj4, true)).toBe(obj1);
});

test('flatten()', () => {
	const file1 = new File([], 'example.txt');
	const file2 = new File([], 'example2.txt');
	const value = {
		email: 'hello@world.com',
		task: [
			'taskname0',
			{
				stage: ['in progress'],
			},
		],
		file: [file1, file2],
		file2: file2,
		objs: { level1: { level2: 'content' } },
	};

	expect(flatten(value)).toEqual({
		'': value,
		email: value.email,
		file: value.file,
		file2: value.file2,
		'file[0]': value.file[0],
		'file[1]': value.file[1],
		task: value.task,
		'task[0]': value.task[0],
		'task[1]': value.task[1],
		// @ts-expect-error
		'task[1].stage': value.task[1].stage,
		// @ts-expect-error
		'task[1].stage[0]': value.task[1].stage[0],
		objs: value.objs,
		'objs.level1': value.objs.level1,
		'objs.level1.level2': value.objs.level1.level2,
	});

	expect(
		flatten(value, (value) => (Array.isArray(value) ? value : null), 'prefix'),
	).toEqual({
		'prefix.file': value.file,
		'prefix.task': value.task,
		// @ts-expect-error
		'prefix.task[1].stage': value.task[1].stage,
	});
});

test('addItems()', () => {
	const emptyArray: Array<unknown> = [];
	const nonEmptyArray = ['a', 'b'];
	expect(addItems(emptyArray, emptyArray)).toBe(emptyArray);
	expect(addItems(emptyArray, nonEmptyArray)).not.toBe(nonEmptyArray);
	expect(addItems(nonEmptyArray, emptyArray)).toBe(nonEmptyArray);
	expect(addItems(nonEmptyArray, nonEmptyArray)).toBe(nonEmptyArray);

	expect(addItems([], ['a', 'b'])).toEqual(['a', 'b']);
	expect(addItems([], ['a', 'b'])).toEqual(['a', 'b']);
	expect(addItems(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd']);
	expect(addItems(['a', 'b'], ['a', 'd'])).toEqual(['a', 'b', 'd']);
});

test('mapKeys()', () => {
	const obj = {
		a: 'a',
		b: 'b',
		c: 'c',
	};
	const emptyObj = {};

	expect(mapKeys(obj, (key) => 'prefix_' + key)).toEqual({
		prefix_a: obj.a,
		prefix_b: obj.b,
		prefix_c: obj.c,
	});
	expect(
		mapKeys(obj, (key) => {
			if (key === 'b') {
				return null;
			}
			return key;
		}),
	).toEqual({
		a: obj.a,
		c: obj.c,
	});
	expect(mapKeys(obj, () => null)).toEqual({});
	expect(mapKeys(obj, (key) => key)).toEqual(obj);
	expect(mapKeys(obj, (key) => key)).toBe(obj);
	expect(mapKeys(emptyObj, (key) => key)).toEqual(emptyObj);
	expect(mapKeys(emptyObj, (key) => key)).toBe(emptyObj);
	expect(mapKeys(emptyObj, () => null)).toEqual(emptyObj);
	expect(mapKeys(emptyObj, () => null)).toBe(emptyObj);
});

test('mapItems()', () => {
	const nullList: Array<any> = [null, null];
	const list: Array<any> = [
		undefined,
		'string',
		100,
		[],
		['a1', 'a2'],
		{},
		{ o1: 'o1' },
	];

	expect(mapItems(nullList, (item) => item)).toEqual([]);
	expect(mapItems(list, (item) => item)).toBe(list);
	expect(mapItems(list, (item) => item)).toEqual(list);
	expect(
		mapItems(list, (item) => {
			if (Array.isArray(item)) {
				return null;
			}

			if (typeof item === 'number') {
				return item + item;
			}

			return item;
		}),
	).toEqual([undefined, 'string', 200, {}, { o1: 'o1' }]);
});

test('configureListIndexUpdate()', () => {
	const increaseIndexInObjects = configureListIndexUpdate(
		'today.tasks[0]',
		(number) => {
			if (number === 1) {
				return number;
			}
			if (number === 2) {
				return null;
			}
			if (number === 3) {
				return -1;
			}
			return number + 1;
		},
	);
	expect(increaseIndexInObjects('today.tasks[0]')).toEqual('today.tasks[0]');
	expect(increaseIndexInObjects('today.tasks[0][0]')).toEqual(
		'today.tasks[0][1]',
	);
	expect(increaseIndexInObjects('today.tasks[0][1]')).toEqual(
		'today.tasks[0][1]',
	);
	expect(increaseIndexInObjects('today.tasks[0][2]')).toEqual(null);
	expect(increaseIndexInObjects('today.tasks[0][3]')).toEqual(
		'today.tasks[0][-1]',
	); // should throw error
	expect(increaseIndexInObjects('today.tasks[0]')).toEqual('today.tasks[0]');
	expect(increaseIndexInObjects('tasks[0]')).toEqual('tasks[0]');
	expect(increaseIndexInObjects('today.tasks[0][0].by')).toEqual(
		'today.tasks[0][1].by',
	);
	expect(increaseIndexInObjects('today.tasks[0][0][0]')).toEqual(
		'today.tasks[0][1][0]',
	);
	expect(increaseIndexInObjects('today.tasks[0][0].by[0]')).toEqual(
		'today.tasks[0][1].by[0]',
	);
	expect(increaseIndexInObjects('today.tasks[0][0].today.tasks[0][0]')).toEqual(
		'today.tasks[0][1].today.tasks[0][0]',
	);
	expect(increaseIndexInObjects('mary.today.tasks[0][0]')).toEqual(
		'mary.today.tasks[0][0]',
	);
	expect(increaseIndexInObjects('')).toEqual('');

	const increaseIndex = configureListIndexUpdate('', (number) => number + 1);
	expect(increaseIndex('tasks[0]')).toEqual('tasks[0]');
	expect(increaseIndex('')).toEqual('');
	expect(increaseIndex('[0]')).toEqual('[1]');
});
