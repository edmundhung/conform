import { assertType, expectTypeOf, test } from 'vitest';
import { createIntentDispatcher } from '../future/dom';
import type { DefaultValue, FieldName } from '../future/types';

test('types: DefaultValue with exactOptionalPropertyTypes', () => {
	// Primitive types
	assertType<DefaultValue<string>>(undefined);
	assertType<DefaultValue<string>>(null);
	assertType<DefaultValue<string>>('text');

	assertType<DefaultValue<number>>(undefined);
	assertType<DefaultValue<number>>(null);
	assertType<DefaultValue<number>>(42);

	assertType<DefaultValue<boolean>>(undefined);
	assertType<DefaultValue<boolean>>(null);
	assertType<DefaultValue<boolean>>(true);

	// Array types
	assertType<DefaultValue<string[]>>(undefined);
	assertType<DefaultValue<string[]>>(null);
	assertType<DefaultValue<string[]>>(['a', 'b']);
	assertType<DefaultValue<string[]>>([undefined, null, 'text']);

	assertType<DefaultValue<number[]>>(undefined);
	assertType<DefaultValue<number[]>>(null);
	assertType<DefaultValue<number[]>>([1, 2, 3]);

	// Object types
	type UserObject = { name: string; email: string };
	assertType<DefaultValue<UserObject>>(undefined);
	assertType<DefaultValue<UserObject>>(null);
	assertType<DefaultValue<UserObject>>({
		name: 'John',
		email: undefined,
	});
	assertType<DefaultValue<UserObject>>({
		name: null,
		email: 'john@example.com',
	});
	assertType<DefaultValue<UserObject>>({
		name: 'John',
		email: 'john@example.com',
	});

	// Nested object types
	type NestedObject = { user: { name: string; age: number } };
	assertType<DefaultValue<NestedObject>>(undefined);
	assertType<DefaultValue<NestedObject>>(null);
	assertType<DefaultValue<NestedObject>>({
		user: { name: 'John', age: null },
	});
	assertType<DefaultValue<NestedObject>>({
		user: { name: undefined, age: 30 },
	});
	assertType<DefaultValue<NestedObject>>({
		user: { name: 'John', age: 30 },
	});

	// Array of objects
	type ItemArray = Array<{ id: string; name: string }>;
	assertType<DefaultValue<ItemArray>>(undefined);
	assertType<DefaultValue<ItemArray>>(null);
	assertType<DefaultValue<ItemArray>>([
		{ id: '1' },
		{ name: null },
		{ id: undefined },
	]);
	assertType<DefaultValue<ItemArray>>([{ name: 'Item' }]);
	assertType<DefaultValue<ItemArray>>([{ id: '1', name: 'Item' }]);
	assertType<DefaultValue<ItemArray>>([null, undefined, { id: '1' }]);

	// File types should only accept null/undefined
	assertType<DefaultValue<File>>(undefined);
	assertType<DefaultValue<File>>(null);

	assertType<DefaultValue<File[]>>(undefined);
	assertType<DefaultValue<File[]>>([undefined, null]);
	assertType<DefaultValue<File[]>>(null);

	// Test with variable assignments to ensure exactOptionalPropertyTypes compatibility
	const stringWithUndefined: DefaultValue<string> = undefined;
	const stringWithNull: DefaultValue<string> = null;
	const stringWithValue: DefaultValue<string> = 'text';

	const numberWithUndefined: DefaultValue<number> = undefined;
	const objectWithUndefined: DefaultValue<UserObject> = undefined;
	const arrayWithUndefined: DefaultValue<string[]> = undefined;

	// Verify variables (to avoid unused variable warnings)
	assertType<DefaultValue<string>>(stringWithUndefined);
	assertType<DefaultValue<string>>(stringWithNull);
	assertType<DefaultValue<string>>(stringWithValue);
	assertType<DefaultValue<number>>(numberWithUndefined);
	assertType<DefaultValue<UserObject>>(objectWithUndefined);
	assertType<DefaultValue<string[]>>(arrayWithUndefined);
});

test('types: intent dispatcher', () => {
	const intent = createIntentDispatcher(() => null, 'test');

	expectTypeOf(intent.validate).toBeFunction();
	expectTypeOf(intent.update).toBeFunction();
	expectTypeOf(intent.insert).toBeFunction();
	expectTypeOf(intent.remove).toBeFunction();
	expectTypeOf(intent.reorder).toBeFunction();

	// Basic usage
	assertType<void>(intent.validate());
	assertType<void>(intent.remove({ name: 'field', index: 0 }));
	assertType<void>(intent.reorder({ name: 'field', from: 0, to: 1 }));

	// Insert intent
	assertType<void>(intent.insert({ name: 'field' }));
	assertType<void>(intent.insert({ name: 'tags', defaultValue: 'new-tag' }));
	assertType<void>(
		intent.insert({
			name: 'items' as FieldName<Array<{ id: string; name: string }>>,
			defaultValue: { id: '1' },
		}),
	);

	// Update intent
	assertType<void>(intent.update({ name: 'field', value: null }));
	assertType<void>(intent.update({ name: 'name', value: 'text' }));
	assertType<void>(intent.update({ name: 'count', value: 42 }));
	assertType<void>(
		intent.update({ name: 'tasks', index: 0, value: { content: 'foo' } }),
	);
	assertType<void>(
		intent.update({
			name: 'user' as FieldName<{ name: string; email: string }>,
			value: { name: 'John' },
		}),
	);
	assertType<void>(
		intent.update({
			value: {
				title: 'New Title' as FieldName<
					Array<{ content: string; completed: boolean }>
				>,
				tasks: [{ content: 'Task 1', completed: false }],
			},
		}),
	);
	assertType<void>(
		intent.update({
			name: 'tasks' as FieldName<
				Array<{ content: string; completed: boolean }>
			>,
			index: 0,
			value: { content: 'Updated Task', completed: true },
		}),
	);
});
