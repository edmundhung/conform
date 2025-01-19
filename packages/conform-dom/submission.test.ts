import { test, expect } from 'vitest';
import { parseSubmission } from './submission';

function createFormData(
	entries: Array<[string, FormDataEntryValue]>,
): FormData {
	const formData = new FormData();

	for (const [name, value] of entries) {
		formData.append(name, value);
	}

	return formData;
}

test('parseSubmission()', () => {
	const emptyFile = new File([], 'example.txt');
	const emptyFile2 = new File([], 'example2.txt');

	expect(
		parseSubmission(
			createFormData([
				['email', 'hello@world.com'],
				['password', 'secret'],
				['task[0]', 'taskname0'],
				['task[1].stage[0]', 'in progress'],
				// ['task[0].stage[0]', 'in progress'],
				['intent', 'login'],
				['file', emptyFile],
				['file', emptyFile2],
				['file2', emptyFile2],
			]),
		),
	).toEqual({
		value: {
			email: 'hello@world.com',
			password: 'secret',
			task: [
				'taskname0',
				{
					stage: ['in progress'],
				},
			],
			intent: 'login',
			file: [emptyFile, emptyFile2],
			file2: emptyFile2,
		},
		fields: [
			'email',
			'password',
			'task[0]',
			'task[1].stage[0]',
			'intent',
			'file',
			'file2',
		],
		intent: null,
	});

	// Default intentName
	expect(
		parseSubmission(
			createFormData([
				['email', 'hello@world.com'],
				['password', 'secret'],
				['__intent__', 'myIntention'],
			]),
		),
	).toEqual({
		value: {
			email: 'hello@world.com',
			password: 'secret',
		},
		fields: ['email', 'password'],
		intent: 'myIntention',
	});

	// Custom intentName
	expect(
		parseSubmission(
			createFormData([
				['email', 'hello@world.com'],
				['password', 'secret'],
				['intent', 'login'],
				['intent', 'update'],
			]),
			{
				intentName: 'intent',
			},
		),
	).toEqual({
		value: {
			email: 'hello@world.com',
			password: 'secret',
		},
		fields: ['email', 'password'],
		intent: 'login',
	});

	// File intent will be ignored
	expect(
		parseSubmission(createFormData([['intent', emptyFile]]), {
			intentName: 'intent',
		}),
	).toEqual({
		value: {},
		fields: [],
		intent: null,
	});
});
