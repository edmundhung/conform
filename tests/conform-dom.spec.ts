import { describe, test, expect } from 'vitest';
import {
	parse,
	getPaths,
	formatPaths,
	isPrefix,
	INTENT,
	STATE,
	serializeIntent,
} from '@conform-to/dom';
import { createFormData } from './helpers';

describe('conform-dom', () => {
	test('parse()', () => {
		const successSubmission = parse(
			new URLSearchParams([
				['title', 'The cat'],
				['description', 'Once upon a time...'],
			]),
			{
				resolve(payload) {
					return { value: payload };
				},
			},
		);
		const errorSubmission = parse(
			createFormData([
				['title', ''],
				['tasks[0].content', 'Test some stuffs'],
				['tasks[0].completed', 'Yes'],
				['tasks[1].content', 'Test integration'],
			]),
			{
				resolve() {
					return { error: { title: ['Test'] } };
				},
			},
		);
		const intentSubmission = parse(
			createFormData([
				['message', 'Hello'],
				[STATE, JSON.stringify({ validated: {} })],
				[
					INTENT,
					serializeIntent({
						type: 'validate',
						payload: { name: 'message' },
					}),
				],
			]),
			{
				resolve() {
					return { error: { message: ['World'] } };
				},
			},
		);

		expect(successSubmission).toEqual({
			status: 'success',
			payload: {
				title: 'The cat',
				description: 'Once upon a time...',
			},
			value: {
				title: 'The cat',
				description: 'Once upon a time...',
			},
			reply: expect.any(Function),
		});
		expect(successSubmission.reply()).toEqual({
			status: 'success',
			initialValue: {
				title: 'The cat',
				description: 'Once upon a time...',
			},
			fields: ['title', 'description'],
		});
		expect(successSubmission.reply({ resetForm: true })).toEqual({
			initialValue: null,
		});
		expect(successSubmission.reply({ formErrors: ['example'] })).toEqual({
			status: 'error',
			initialValue: {
				title: 'The cat',
				description: 'Once upon a time...',
			},
			error: {
				'': ['example'],
			},
			fields: ['title', 'description'],
		});
		expect(
			successSubmission.reply({ fieldErrors: { description: ['invalid'] } }),
		).toEqual({
			status: 'error',
			initialValue: {
				title: 'The cat',
				description: 'Once upon a time...',
			},
			error: {
				description: ['invalid'],
			},
			fields: ['title', 'description'],
		});
		expect(successSubmission.reply({ hideFields: ['title'] })).toEqual({
			status: 'success',
			initialValue: {
				description: 'Once upon a time...',
			},
			fields: ['title', 'description'],
		});
		expect(errorSubmission).toEqual({
			status: 'error',
			payload: {
				title: '',
				tasks: [
					{ content: 'Test some stuffs', completed: 'Yes' },
					{ content: 'Test integration' },
				],
			},
			error: {
				title: ['Test'],
			},
			reply: expect.any(Function),
		});
		expect(errorSubmission.reply()).toEqual({
			status: 'error',
			initialValue: {
				tasks: [
					{ content: 'Test some stuffs', completed: 'Yes' },
					{ content: 'Test integration' },
				],
			},
			error: {
				title: ['Test'],
			},
			fields: [
				'title',
				'tasks[0].content',
				'tasks[0].completed',
				'tasks[1].content',
			],
		});
		expect(errorSubmission.reply({ resetForm: true })).toEqual({
			initialValue: null,
		});
		expect(errorSubmission.reply({ formErrors: ['example'] })).toEqual({
			status: 'error',
			initialValue: {
				tasks: [
					{ content: 'Test some stuffs', completed: 'Yes' },
					{ content: 'Test integration' },
				],
			},
			error: {
				'': ['example'],
				title: ['Test'],
			},
			fields: [
				'title',
				'tasks[0].content',
				'tasks[0].completed',
				'tasks[1].content',
			],
		});
		expect(
			errorSubmission.reply({ fieldErrors: { title: ['invalid'] } }),
		).toEqual({
			status: 'error',
			initialValue: {
				tasks: [
					{ content: 'Test some stuffs', completed: 'Yes' },
					{ content: 'Test integration' },
				],
			},
			error: {
				title: ['invalid'],
			},
			fields: [
				'title',
				'tasks[0].content',
				'tasks[0].completed',
				'tasks[1].content',
			],
		});
		expect(errorSubmission.reply({ hideFields: ['tasks'] })).toEqual({
			status: 'error',
			initialValue: {},
			error: {
				title: ['Test'],
			},
			fields: [
				'title',
				'tasks[0].content',
				'tasks[0].completed',
				'tasks[1].content',
			],
		});
		expect(intentSubmission).toEqual({
			status: undefined,
			payload: {
				message: 'Hello',
			},
			error: {
				message: ['World'],
			},
			reply: expect.any(Function),
		});
		expect(intentSubmission.reply()).toEqual({
			status: undefined,
			intent: {
				type: 'validate',
				payload: { name: 'message' },
			},
			initialValue: {
				message: 'Hello',
			},
			error: {
				message: ['World'],
			},
			fields: ['message'],
			state: {
				validated: {},
			},
		});
		expect(intentSubmission.reply({ formErrors: ['example'] })).toEqual({
			status: undefined,
			intent: {
				type: 'validate',
				payload: { name: 'message' },
			},
			initialValue: {
				message: 'Hello',
			},
			error: {
				'': ['example'],
				message: ['World'],
			},
			fields: ['message'],
			state: {
				validated: {},
			},
		});
		expect(
			intentSubmission.reply({ fieldErrors: { message: ['invalid'] } }),
		).toEqual({
			status: undefined,
			intent: {
				type: 'validate',
				payload: { name: 'message' },
			},
			initialValue: {
				message: 'Hello',
			},
			error: {
				message: ['invalid'],
			},
			fields: ['message'],
			state: {
				validated: {},
			},
		});
		expect(intentSubmission.reply({ resetForm: true })).toEqual({
			initialValue: null,
		});
		expect(intentSubmission.reply({ hideFields: ['message'] })).toEqual({
			status: undefined,
			intent: {
				type: 'validate',
				payload: { name: 'message' },
			},
			initialValue: {},
			error: {
				message: ['World'],
			},
			fields: ['message'],
			state: {
				validated: {},
			},
		});
	});

	test('getPaths()', () => {
		expect(getPaths('')).toEqual([]);
		expect(getPaths('title')).toEqual(['title']);
		expect(getPaths('123')).toEqual(['123']);
		expect(getPaths('amount.currency')).toEqual(['amount', 'currency']);
		expect(getPaths('[0]')).toEqual([0]);
		expect(getPaths('tasks[0]')).toEqual(['tasks', 0]);
		expect(getPaths('tasks[1].completed')).toEqual(['tasks', 1, 'completed']);
		expect(getPaths('multiple[0][1][2]')).toEqual(['multiple', 0, 1, 2]);
		expect(getPaths('books[0].chapters[1]')).toEqual([
			'books',
			0,
			'chapters',
			1,
		]);
	});

	test('formatPaths()', () => {
		expect(formatPaths([])).toEqual('');
		expect(formatPaths([0])).toEqual('[0]');
		expect(formatPaths(['title'])).toEqual('title');
		expect(formatPaths(['amount', 'currency'])).toEqual('amount.currency');
		expect(formatPaths(['tasks', 0])).toEqual('tasks[0]');
		expect(formatPaths(['tasks', 1, 'completed'])).toEqual(
			'tasks[1].completed',
		);
	});

	test('isPrefix()', () => {
		expect(isPrefix('', '')).toBe(true);
		expect(isPrefix('address', '')).toBe(true);
		expect(isPrefix('address', 'address')).toBe(true);
		expect(isPrefix('address', 'address.city')).toBe(false);
		expect(isPrefix('address.city', '')).toBe(true);
		expect(isPrefix('address.city', 'address')).toBe(true);
		expect(isPrefix('address.city', 'address.city')).toBe(true);
		expect(isPrefix('address.city', 'address.street')).toBe(false);
		expect(isPrefix('address.city.zipcode', '')).toBe(true);
		expect(isPrefix('address.city.zipcode', 'address.city')).toBe(true);

		expect(isPrefix('tasks[0]', '')).toBe(true);
		expect(isPrefix('tasks[0]', 'tasks')).toBe(true);
		expect(isPrefix('tasks[0]', 'tasks[0]')).toBe(true);
		expect(isPrefix('tasks[0]', 'tasks[1]')).toBe(false);
		expect(isPrefix('tasks[0].content', '')).toBe(true);
		expect(isPrefix('tasks[0].content', 'tasks')).toBe(true);
		expect(isPrefix('tasks[0].content', 'tasks[0]')).toBe(true);
		expect(isPrefix('tasks[0].content', 'tasks[0].content')).toBe(true);
		expect(isPrefix('tasks[0].content', 'tasks[1].content')).toBe(false);
		expect(isPrefix('tasks[0].content', 'tasks[0].completed')).toBe(false);
	});
});
