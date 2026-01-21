import { assertType, expectTypeOf, test } from 'vitest';
import type {
	Control,
	DefaultValue,
	FieldMetadata,
	FieldName,
	Fieldset,
	FormMetadata,
	FormOptions,
	InferBaseErrorShape,
	InferCustomFieldMetadata,
	InferCustomFormMetadata,
	IntentDispatcher,
} from '@conform-to/react/future';
import { useFormData, configureForms, shape } from '@conform-to/react/future';
import { useRef } from 'react';

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

	// Users must provide at least one of onSubmit or lastResult
	assertType<FormOptions<TestSchema>>({
		lastResult: undefined,
	});

	// Users can provide onSubmit instead of lastResult
	assertType<FormOptions<TestSchema>>({
		onSubmit: () => {},
	});

	// Users should be able to pass null for lastResult
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

test('useFormData', () => {
	const formRef = useRef<HTMLFormElement>(null);

	// Without fallback - returns Value | undefined
	const resultWithoutFallback = useFormData(formRef, (formData) =>
		formData.get('name'),
	);
	assertType<string | null | undefined>(resultWithoutFallback);

	// With fallback - returns Value (no undefined)
	const resultWithFallback = useFormData(
		formRef,
		(formData) => formData.get('name') ?? '',
		{ fallback: '' },
	);
	assertType<string>(resultWithFallback);
	// Verify it's not undefined
	expectTypeOf(resultWithFallback).not.toBeUndefined();

	// With acceptFiles: true and fallback
	const resultWithFilesAndFallback = useFormData(
		formRef,
		(formData) => formData.getAll('files'),
		{ acceptFiles: true, fallback: [] as FormDataEntryValue[] },
	);
	assertType<FormDataEntryValue[]>(resultWithFilesAndFallback);

	// With acceptFiles: true without fallback
	const resultWithFilesNoFallback = useFormData(
		formRef,
		(formData) => formData.getAll('files'),
		{ acceptFiles: true },
	);
	assertType<FormDataEntryValue[] | undefined>(resultWithFilesNoFallback);
});

test('InferBaseErrorShape, InferCustomFormMetadata, and InferCustomFieldMetadata', () => {
	// Test with minimal config (no custom metadata)
	const simpleResult = configureForms({});

	// InferBaseErrorShape returns the error shape (defaults to string)
	type SimpleErrorShape = InferBaseErrorShape<typeof simpleResult.config>;
	expectTypeOf<SimpleErrorShape>().toEqualTypeOf<string>();

	// InferCustomFormMetadata returns the custom form metadata extension (empty by default)
	type SimpleFormExt = InferCustomFormMetadata<typeof simpleResult.config>;
	expectTypeOf<SimpleFormExt>().toEqualTypeOf<{}>();

	// InferCustomFieldMetadata returns the custom field metadata extension (empty by default)
	type SimpleFieldExt = InferCustomFieldMetadata<typeof simpleResult.config>;
	expectTypeOf<SimpleFieldExt>().toEqualTypeOf<{}>();

	// Test with custom error shape
	const errorShapeResult = configureForms({
		isError: shape<{ message: string; code: string }>(),
	});

	type CustomErrorShape = InferBaseErrorShape<typeof errorShapeResult.config>;
	expectTypeOf<CustomErrorShape>().toEqualTypeOf<{
		message: string;
		code: string;
	}>();

	// Test with custom form metadata extension
	const formMetadataResult = configureForms({
		extendFormMetadata(metadata) {
			return {
				get customFormProp() {
					return `custom-${metadata.id}`;
				},
			};
		},
	});

	type CustomFormExt = InferCustomFormMetadata<
		typeof formMetadataResult.config
	>;
	expectTypeOf<CustomFormExt>().not.toBeNever();
	expectTypeOf<CustomFormExt['customFormProp']>().toEqualTypeOf<string>();

	// Test with custom field metadata extension
	const fieldMetadataResult = configureForms({
		extendFieldMetadata(metadata) {
			return {
				get inputProps() {
					return {
						name: metadata.name,
						required: metadata.required,
					};
				},
			};
		},
	});

	type CustomFieldExt = InferCustomFieldMetadata<
		typeof fieldMetadataResult.config
	>;
	expectTypeOf<CustomFieldExt>().not.toBeNever();
	expectTypeOf<CustomFieldExt['inputProps']>().not.toBeNever();

	// Test composing with FormMetadata, FieldMetadata, and Fieldset
	// This is the main use case: users can define reusable types for components
	type TestSchema = { name: string; email: string };

	type MyFormMetadata = FormMetadata<
		InferBaseErrorShape<typeof fieldMetadataResult.config>,
		InferCustomFormMetadata<typeof fieldMetadataResult.config>,
		InferCustomFieldMetadata<typeof fieldMetadataResult.config>
	>;

	type MyFieldMetadata<T> = FieldMetadata<
		T,
		InferBaseErrorShape<typeof fieldMetadataResult.config>,
		InferCustomFieldMetadata<typeof fieldMetadataResult.config>
	>;

	type MyFieldset<T> = Fieldset<
		T,
		InferBaseErrorShape<typeof fieldMetadataResult.config>,
		InferCustomFieldMetadata<typeof fieldMetadataResult.config>
	>;

	// Verify composed types have the custom properties
	expectTypeOf<MyFormMetadata['id']>().toBeString();

	// MyFieldMetadata should have the custom inputProps
	expectTypeOf<MyFieldMetadata<string>['inputProps']>().not.toBeNever();
	expectTypeOf<MyFieldMetadata<string>['name']>().toBeString();

	// MyFieldset fields should also have inputProps
	expectTypeOf<MyFieldset<TestSchema>['name']['inputProps']>().not.toBeNever();
	expectTypeOf<MyFieldset<TestSchema>['email']['inputProps']>().not.toBeNever();

	// getFieldset() should return Fieldset with custom metadata preserved
	// Test by creating a mock field and calling getFieldset with explicit type
	const mockField = {} as MyFieldMetadata<TestSchema>;
	const fieldset = mockField.getFieldset();
	// The returned fieldset's fields should have the custom inputProps
	expectTypeOf(fieldset.name.inputProps).not.toBeNever();
	expectTypeOf(fieldset.email.inputProps).not.toBeNever();

	// getFieldList() should return FieldMetadata[] with custom metadata preserved
	type ListSchema = Array<{ title: string }>;
	type ItemMetadata = ReturnType<
		MyFieldMetadata<ListSchema>['getFieldList']
	>[number];
	expectTypeOf<ItemMetadata['inputProps']>().not.toBeNever();
});
