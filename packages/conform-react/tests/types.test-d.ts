import { assertType, expectTypeOf, test } from 'vitest';
import type {
	Control,
	DefaultValue,
	FieldMetadata,
	FieldName,
	FormOptions,
	IntentDispatcher,
} from '@conform-to/react/future';

test('DefaultValue', () => {
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

test('FormOptions', () => {
	type TestSchema = { name: string; email: string };

	// Users should be able to pass undefined for optional properties
	assertType<FormOptions<TestSchema>>({
		lastResult: undefined,
	});

	// Users should be able to omit optional properties
	assertType<FormOptions<TestSchema>>({});

	// Users should be able to pass null
	assertType<FormOptions<TestSchema>>({
		lastResult: null,
	});
});

test('IntentDispatcher', () => {
	// IntentDispatcher is the return type of useIntent
	type TestSchema = {
		name: string;
		tags: string[];
		tasks: Array<{ content: string; completed: boolean }>;
	};

	const intent = {} as IntentDispatcher<TestSchema>;

	// Verify all intent methods exist
	expectTypeOf(intent.validate).toBeFunction();
	expectTypeOf(intent.update).toBeFunction();
	expectTypeOf(intent.insert).toBeFunction();
	expectTypeOf(intent.remove).toBeFunction();
	expectTypeOf(intent.reorder).toBeFunction();

	// Test validate
	assertType<void>(intent.validate());
	assertType<void>(intent.validate('name'));

	// Test remove
	assertType<void>(intent.remove({ name: 'tasks', index: 0 }));

	// Test reorder
	assertType<void>(intent.reorder({ name: 'tasks', from: 0, to: 1 }));

	// Test insert
	assertType<void>(intent.insert({ name: 'tags' }));
	assertType<void>(intent.insert({ name: 'tags', defaultValue: 'new-tag' }));
	assertType<void>(intent.insert({ name: 'tags', defaultValue: undefined }));
	assertType<void>(
		intent.insert({
			name: 'tasks' as FieldName<
				Array<{ content: string; completed: boolean }>
			>,
			defaultValue: { content: 'New Task' },
		}),
	);

	// Test update
	assertType<void>(intent.update({ name: 'name', value: 'text' }));
	assertType<void>(intent.update({ name: 'name', value: null }));
	assertType<void>(intent.update({ name: 'name', value: undefined }));
	assertType<void>(
		intent.update({ name: 'tasks', index: 0, value: { content: 'foo' } }),
	);
	assertType<void>(
		intent.update({
			value: {
				name: 'Updated Name',
				tags: ['tag1', 'tag2'],
			},
		}),
	);
});

test('FieldMetadata', () => {
	interface TestInterface {
		field: string;
		nested: {
			value: number;
		};
	}

	// Test with type declaration
	type TestType = {
		field: string;
		nested: {
			value: number;
		};
	};

	// Mock field metadata
	const interfaceField = {} as FieldMetadata<TestInterface | null | undefined>;
	const typeField = {} as FieldMetadata<TestType | null | undefined>;

	// Both should correctly infer the fieldset type
	const interfaceFieldset = interfaceField.getFieldset();

	// Verify that both have the correct properties
	assertType<FieldMetadata<string>>(interfaceFieldset.field);
	assertType<FieldMetadata<{ value: number }>>(interfaceFieldset.nested);

	const typeFieldset = typeField.getFieldset();

	assertType<FieldMetadata<string>>(typeFieldset.field);
	assertType<FieldMetadata<{ value: number }>>(typeFieldset.nested);

	const customFieldset = typeField.getFieldset<
		TestInterface | null | undefined
	>();

	assertType<FieldMetadata<string>>(customFieldset.field);
	assertType<FieldMetadata<{ value: number }>>(customFieldset.nested);

	const customNestedFieldset = customFieldset.nested.getFieldset();

	assertType<FieldMetadata<number>>(customNestedFieldset.value);
});

test('Control', () => {
	const control = {} as Control;

	// Verify all control properties exist and have correct types
	assertType<string | undefined>(control.value);
	assertType<boolean | undefined>(control.checked);
	assertType<string[] | undefined>(control.options);
	assertType<File[] | undefined>(control.files);

	// Verify methods exist
	expectTypeOf(control.register).toBeFunction();
	expectTypeOf(control.change).toBeFunction();
	expectTypeOf(control.focus).toBeFunction();
	expectTypeOf(control.blur).toBeFunction();

	// Test method signatures
	assertType<void>(control.register(null));
	assertType<void>(control.change('text'));
	assertType<void>(control.change(['option1', 'option2']));
	assertType<void>(control.change(true));
	assertType<void>(control.change(null));
	assertType<void>(control.focus());
	assertType<void>(control.blur());
});
