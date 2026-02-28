import { test, expect, vi } from 'vitest';
import {
	getFormElement,
	getSubmitEvent,
	initializeField,
	resolveControlPayload,
	deriveDefaultPayload,
	updateFormValue,
	createIntentDispatcher,
} from '../future/dom';

test('getFormElement', () => {
	// Test with string ID
	const form = document.createElement('form');
	form.setAttribute('name', 'testForm');
	document.body.appendChild(form);

	expect(getFormElement('testForm')).toBe(form);
	expect(getFormElement('nonExistent')).toBeNull();

	document.body.removeChild(form);

	// Test with ref object containing form element
	const formRef = { current: form };
	expect(getFormElement(formRef)).toBe(form);

	// Test with ref object containing input element
	const input = document.createElement('input');
	form.appendChild(input); // This sets input.form automatically
	const inputRef = { current: input };
	expect(getFormElement(inputRef)).toBe(form);

	// Test with null ref
	const nullRef = { current: null };
	expect(getFormElement(nullRef)).toBeNull();

	// Test with undefined
	expect(getFormElement(undefined)).toBeNull();
});

test('getSubmitEvent', () => {
	const nativeEvent = new Event('submit') as SubmitEvent;
	const reactEvent = {
		type: 'submit',
		nativeEvent,
	} as unknown as React.FormEvent<HTMLFormElement>;

	expect(getSubmitEvent(reactEvent)).toBe(nativeEvent);

	// Test with non-submit event
	const clickEvent = {
		type: 'click',
		nativeEvent: new Event('click'),
	} as React.FormEvent<HTMLFormElement>;

	expect(() => getSubmitEvent(clickEvent)).toThrow(
		'The event is not a submit event',
	);
});

test('initializeField', () => {
	const input = document.createElement('input');

	// Test basic initialization
	initializeField(input, { defaultValue: 'test' });
	expect(input.dataset.conform).toBe('initialized');
	expect(input.value).toBe('test');

	// Test already initialized field
	const spy = vi.fn();
	input.addEventListener('change', spy);
	initializeField(input, { defaultValue: 'new' });
	expect(spy).not.toHaveBeenCalled(); // Should return early

	// Test checkbox initialization
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	initializeField(checkbox, { defaultChecked: true, value: 'on' });
	expect(checkbox.checked).toBe(true);
	expect(checkbox.dataset.conform).toBe('initialized');

	// Test with null value
	const input2 = document.createElement('input');
	initializeField(input2, { defaultChecked: false });
	expect(input2.value).toBe('');
});

test('resolveControlPayload', () => {
	// Test file input
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	const file = new File(['test'], 'test.txt');
	Object.defineProperty(fileInput, 'files', {
		value: [file],
		writable: false,
	});

	expect(resolveControlPayload(fileInput)).toEqual([file]);

	// Test radio input
	const radioInput = document.createElement('input');
	radioInput.type = 'radio';
	radioInput.value = 'test';
	radioInput.checked = true;

	expect(resolveControlPayload(radioInput)).toBe('test');

	// Test checkbox input
	const checkboxInput = document.createElement('input');
	checkboxInput.type = 'checkbox';
	checkboxInput.value = 'test';
	checkboxInput.checked = false;

	expect(resolveControlPayload(checkboxInput)).toBe(null);

	// Test select multiple
	const selectMultiple = document.createElement('select');
	selectMultiple.multiple = true;
	const option1 = document.createElement('option');
	option1.value = 'option1';
	option1.selected = true;
	const option2 = document.createElement('option');
	option2.value = 'option2';
	option2.selected = false;
	selectMultiple.appendChild(option1);
	selectMultiple.appendChild(option2);

	expect(resolveControlPayload(selectMultiple)).toEqual(['option1']);

	// Test regular input
	const textInput = document.createElement('input');
	textInput.value = 'test value';

	expect(resolveControlPayload(textInput)).toBe('test value');

	// Test textarea
	const textarea = document.createElement('textarea');
	textarea.value = 'textarea value';

	expect(resolveControlPayload(textarea)).toBe('textarea value');

	// Test fieldset checkbox group
	const checkboxFieldset = document.createElement('fieldset');
	checkboxFieldset.name = 'topics';
	const checkboxA = document.createElement('input');
	checkboxA.type = 'checkbox';
	checkboxA.name = 'topics';
	checkboxA.value = 'a';
	checkboxA.checked = true;
	const checkboxB = document.createElement('input');
	checkboxB.type = 'checkbox';
	checkboxB.name = 'topics';
	checkboxB.value = 'b';
	checkboxB.checked = false;
	checkboxFieldset.append(checkboxA, checkboxB);

	expect(resolveControlPayload(checkboxFieldset)).toEqual(['a']);
	checkboxA.checked = false;
	checkboxB.checked = true;
	expect(resolveControlPayload(checkboxFieldset)).toEqual(['b']);
	checkboxA.checked = false;
	checkboxB.checked = false;
	expect(resolveControlPayload(checkboxFieldset)).toEqual([]);

	// Test array checkbox group
	const checkboxGroupA = document.createElement('input');
	checkboxGroupA.type = 'checkbox';
	checkboxGroupA.name = 'group';
	checkboxGroupA.value = 'a';
	checkboxGroupA.checked = true;
	const checkboxGroupB = document.createElement('input');
	checkboxGroupB.type = 'checkbox';
	checkboxGroupB.name = 'group';
	checkboxGroupB.value = 'b';
	checkboxGroupB.checked = false;

	expect(resolveControlPayload([checkboxGroupA, checkboxGroupB])).toEqual([
		'a',
	]);
	checkboxGroupA.checked = false;
	checkboxGroupB.checked = true;
	expect(resolveControlPayload([checkboxGroupA, checkboxGroupB])).toEqual([
		'b',
	]);
	checkboxGroupA.checked = false;
	checkboxGroupB.checked = false;
	expect(resolveControlPayload([checkboxGroupA, checkboxGroupB])).toEqual([]);

	// Test fieldset radio group
	const radioFieldset = document.createElement('fieldset');
	radioFieldset.name = 'choice';
	const radioA = document.createElement('input');
	radioA.type = 'radio';
	radioA.name = 'choice';
	radioA.value = 'a';
	radioA.checked = false;
	const radioB = document.createElement('input');
	radioB.type = 'radio';
	radioB.name = 'choice';
	radioB.value = 'b';
	radioB.checked = true;
	radioFieldset.append(radioA, radioB);

	expect(resolveControlPayload(radioFieldset)).toEqual('b');
	radioA.checked = true;
	radioB.checked = false;
	expect(resolveControlPayload(radioFieldset)).toEqual('a');
	radioA.checked = false;
	radioB.checked = false;
	expect(resolveControlPayload(radioFieldset)).toBeNull();

	// Test array radio group
	const radioGroupA = document.createElement('input');
	radioGroupA.type = 'radio';
	radioGroupA.name = 'radio-group';
	radioGroupA.value = 'a';
	radioGroupA.checked = false;
	const radioGroupB = document.createElement('input');
	radioGroupB.type = 'radio';
	radioGroupB.name = 'radio-group';
	radioGroupB.value = 'b';
	radioGroupB.checked = true;

	expect(resolveControlPayload([radioGroupA, radioGroupB])).toEqual('b');
	radioGroupA.checked = true;
	radioGroupB.checked = false;
	expect(resolveControlPayload([radioGroupA, radioGroupB])).toEqual('a');
	radioGroupA.checked = false;
	radioGroupB.checked = false;
	expect(resolveControlPayload([radioGroupA, radioGroupB])).toBeUndefined();

	// Test fieldset with structured names
	const structuredFieldset = document.createElement('fieldset');
	structuredFieldset.name = 'members';
	const memberId = document.createElement('input');
	memberId.name = 'members[0].id';
	memberId.value = '1';
	const memberRole = document.createElement('input');
	memberRole.name = 'members[0].role';
	memberRole.value = 'developer';
	structuredFieldset.append(memberId, memberRole);

	expect(resolveControlPayload(structuredFieldset)).toEqual([
		{ id: '1', role: 'developer' },
	]);
});

test('deriveDefaultPayload', () => {
	// Test checkbox/radio with value and defaultChecked
	expect(deriveDefaultPayload({ defaultChecked: true, value: 'custom' })).toBe(
		'custom',
	);
	expect(deriveDefaultPayload({ defaultChecked: false })).toBe(null);

	// Test string defaultValue
	expect(deriveDefaultPayload({ defaultValue: 'test string' })).toBe(
		'test string',
	);

	// Test string array (for select multiple)
	expect(
		deriveDefaultPayload({ defaultValue: ['option1', 'option2'] }),
	).toEqual(['option1', 'option2']);

	// Test File array
	const file1 = new File(['test1'], 'test1.txt');
	const file2 = new File(['test2'], 'test2.txt');
	expect(deriveDefaultPayload({ defaultValue: [file1, file2] })).toEqual([
		file1,
		file2,
	]);

	// Test complex objects
	expect(
		deriveDefaultPayload({
			defaultValue: [{ id: '1', name: 'Alice' }],
			parse(payload) {
				return payload;
			},
		}),
	).toEqual([{ id: '1', name: 'Alice' }]);

	// Test single File
	const file = new File(['test'], 'test.txt');
	expect(deriveDefaultPayload({ defaultValue: file })).toEqual(file);

	// Test null
	expect(deriveDefaultPayload({ defaultValue: null })).toBeNull();

	// Test undefined
	expect(deriveDefaultPayload({})).toBeUndefined();
});

test('updateFormValue', () => {
	const form = document.createElement('form');

	const textInput = document.createElement('input');
	textInput.name = 'text';
	textInput.type = 'text';
	form.appendChild(textInput);

	const numberInput = document.createElement('input');
	numberInput.name = 'number';
	numberInput.type = 'number';
	form.appendChild(numberInput);

	const checkbox = document.createElement('input');
	checkbox.name = 'checkbox';
	checkbox.type = 'checkbox';
	form.appendChild(checkbox);

	const textarea = document.createElement('textarea');
	textarea.name = 'textarea';
	form.appendChild(textarea);

	const select = document.createElement('select');
	select.name = 'select';
	const option1 = document.createElement('option');
	option1.value = '';
	option1.text = '--Please choose an option--';
	const option2 = document.createElement('option');
	option2.value = 'foo';
	option2.text = 'foo';
	const option3 = document.createElement('option');
	option3.value = 'bar';
	option3.text = 'bar';
	option3.defaultSelected = true;
	select.appendChild(option1);
	select.appendChild(option2);
	select.appendChild(option3);
	form.appendChild(select);

	const mockSerialize = vi.fn((value) => {
		if (typeof value === 'string') return value;
		if (typeof value === 'number') return value.toFixed(2);
		if (typeof value === 'boolean') return value ? 'on' : undefined;
		return undefined;
	});

	expect(textInput.value).toBe('');
	expect(numberInput.value).toBe('');
	expect(checkbox.checked).toBe(false);
	expect(textarea.value).toBe('');
	expect(select.value).toBe('bar');

	updateFormValue(
		form,
		{
			text: 'Hello World',
			number: 42,
			checkbox: true,
			textarea: 'Sample text',
			select: 'foo',
		},
		mockSerialize,
	);

	expect(mockSerialize).toHaveBeenCalledTimes(5);
	expect(textInput.value).toBe('Hello World');
	expect(numberInput.value).toBe('42.00');
	expect(checkbox.checked).toBe(true);
	expect(textarea.value).toBe('Sample text');
	expect(select.value).toBe('foo');

	updateFormValue(form, {}, mockSerialize);

	expect(textInput.value).toBe('');
	expect(numberInput.value).toBe('');
	expect(checkbox.checked).toBe(false);
	expect(textarea.value).toBe('');
	expect(select.value).toBe('');
});

test('createIntentDispatcher', () => {
	const mockForm = document.createElement('form');

	const dispatcher = createIntentDispatcher(mockForm, 'intent');

	// Test property access creates function
	expect(typeof dispatcher.reset).toBe('function');
	expect(typeof dispatcher.validate).toBe('function');

	// Test with form getter function
	const getForm = vi.fn(() => mockForm);
	const dispatcher2 = createIntentDispatcher(getForm, 'intent');
	expect(typeof dispatcher2.reset).toBe('function');

	// Test error when form is not found
	const getNullForm = vi.fn(() => null);
	const dispatcher3 = createIntentDispatcher(getNullForm, 'intent');
	expect(() => dispatcher3.reset()).toThrow(
		'Dispatching "reset" intent failed; No form element found.',
	);
});
