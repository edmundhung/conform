import { describe, expect, test } from 'vitest';
import { useForm } from '../future';
import { createResult, serverRenderHook } from './helpers';
import { DEFAULT_INTENT } from '../future/hooks';
import { serializeIntent } from '../future/form';
import {
	InsertIntent,
	RemoveIntent,
	ReorderIntent,
	ResetIntent,
	UpdateIntent,
	ValidateIntent,
} from '../future/types';

describe('future export: useForm', () => {
	test('default state', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; description: string }, string>({
				onValidate: () => undefined,
			}),
		);

		expect(form.errors).toBe(undefined);
		expect(fields.title.defaultValue).toBe(undefined);
		expect(fields.title.errors).toBe(undefined);
		expect(fields.description.defaultValue).toBe(undefined);
		expect(fields.description.errors).toBe(undefined);
	});

	test('default value', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; description: string }, string>({
				defaultValue: { title: 'Example', description: 'Hello World' },
				onValidate: () => undefined,
			}),
		);

		expect(form.errors).toBe(undefined);
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe(undefined);
		expect(fields.description.defaultValue).toBe('Hello World');
		expect(fields.description.errors).toBe(undefined);
	});

	test('initialize with last submission result', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; description: string }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						['description', 'Hello World'],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								description: 'Description error',
							},
						},
					},
				),
				onValidate: () => undefined,
			}),
		);

		expect(form.errors).toBe('Form error');
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe('Title error');
		expect(fields.description.defaultValue).toBe('Hello World');
		expect(fields.description.errors).toBe('Description error');
	});

	test('initialize with validate intent', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; description: string }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						['description', 'Hello World'],
						[
							DEFAULT_INTENT,
							serializeIntent<ValidateIntent>({
								type: 'validate',
								payload: 'title',
							}),
						],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								description: 'Description error',
							},
						},
					},
				),
				onValidate: () => undefined,
			}),
		);

		expect(form.errors).toBe('Form error');
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe('Title error');
		expect(fields.description.defaultValue).toBe('Hello World');
		expect(fields.description.errors).toBe(undefined);
	});

	test('initialize with update result', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; description: string }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						['description', 'Hello World'],
						[
							DEFAULT_INTENT,
							serializeIntent<UpdateIntent>({
								type: 'update',
								payload: {
									name: 'description',
									value: 'Updated description',
								},
							}),
						],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								description: 'Description error',
							},
						},
					},
				),
				onValidate: () => undefined,
			}),
		);

		expect(form.errors).toBe('Form error');
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe(undefined);
		expect(fields.description.defaultValue).toBe('Updated description');
		expect(fields.description.errors).toBe('Description error');
	});

	test('initialize with reset intent', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; description: string }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						['description', 'Hello World'],
						[
							DEFAULT_INTENT,
							serializeIntent<ResetIntent>({
								type: 'reset',
							}),
						],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								description: 'Description error',
							},
						},
					},
				),
				defaultValue: {
					title: 'Default Title',
				},
				onValidate: () => undefined,
			}),
		);

		expect(form.errors).toBe(undefined);
		expect(fields.title.defaultValue).toBe('Default Title');
		expect(fields.title.errors).toBe(undefined);
		expect(fields.description.defaultValue).toBe(undefined);
		expect(fields.description.errors).toBe(undefined);
	});

	test('initialize with insert intent', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; notes: string[] }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						[
							DEFAULT_INTENT,
							serializeIntent<InsertIntent>({
								type: 'insert',
								payload: {
									name: 'notes',
									defaultValue: 'Foo',
								},
							}),
						],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								notes: 'Notes error',
								'notes[0]': 'First note error',
							},
						},
					},
				),
				defaultValue: {
					title: 'Default Title',
				},
				onValidate: () => undefined,
			}),
		);
		const notes = fields.notes.getFieldList();

		expect(form.errors).toBe('Form error');
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe(undefined);
		expect(fields.notes.defaultValue).toBe(undefined);
		expect(fields.notes.defaultOptions).toEqual(['Foo']);
		expect(fields.notes.errors).toBe('Notes error');
		expect(notes[0]?.defaultValue).toBe('Foo');
		expect(notes[0]?.errors).toBe(undefined);
	});

	test('initialize with reorder intent', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; notes: string[] }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						['notes[0]', 'First note'],
						['notes[1]', 'Second note'],
						['notes[2]', 'Third note'],
						[
							DEFAULT_INTENT,
							serializeIntent<ReorderIntent>({
								type: 'reorder',
								payload: {
									name: 'notes',
									from: 1,
									to: 0,
								},
							}),
						],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								notes: 'Notes error',
								'notes[0]': 'First note error',
								'notes[1]': 'Second note error',
								'notes[2]': 'Third note error',
							},
						},
					},
				),
				onValidate: () => undefined,
			}),
		);
		const notes = fields.notes.getFieldList();

		expect(form.errors).toBe('Form error');
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe(undefined);
		expect(fields.notes.defaultValue).toBe(undefined);
		expect(fields.notes.defaultOptions).toEqual([
			'Second note',
			'First note',
			'Third note',
		]);
		expect(fields.notes.errors).toBe('Notes error');
		expect(notes[0]?.defaultValue).toBe('Second note');
		expect(notes[0]?.errors).toBe(undefined);
		expect(notes[1]?.defaultValue).toBe('First note');
		expect(notes[1]?.errors).toBe(undefined);
		expect(notes[2]?.defaultValue).toBe('Third note');
		expect(notes[2]?.errors).toBe(undefined);
	});

	test('initialize with remove intent', () => {
		const { form, fields } = serverRenderHook(() =>
			useForm<{ title: string; notes: string[] }, string>({
				lastResult: createResult(
					[
						['title', 'Example'],
						['notes[0]', 'First note'],
						['notes[1]', 'Second note'],
						['notes[2]', 'Third note'],
						[
							DEFAULT_INTENT,
							serializeIntent<RemoveIntent>({
								type: 'remove',
								payload: {
									name: 'notes',
									index: 1,
								},
							}),
						],
					],
					{
						error: {
							formErrors: 'Form error',
							fieldErrors: {
								title: 'Title error',
								notes: 'Notes error',
								'notes[0]': 'First note error',
								'notes[1]': 'Third note error',
							},
						},
					},
				),
				onValidate: () => undefined,
			}),
		);
		const notes = fields.notes.getFieldList();

		expect(form.errors).toBe('Form error');
		expect(fields.title.defaultValue).toBe('Example');
		expect(fields.title.errors).toBe(undefined);
		expect(fields.notes.defaultValue).toBe(undefined);
		expect(fields.notes.defaultOptions).toEqual(['First note', 'Third note']);
		expect(fields.notes.errors).toBe('Notes error');
		expect(notes[0]?.defaultValue).toBe('First note');
		expect(notes[0]?.errors).toBe(undefined);
		expect(notes[1]?.defaultValue).toBe('Third note');
		expect(notes[1]?.errors).toBe(undefined);
	});
});
