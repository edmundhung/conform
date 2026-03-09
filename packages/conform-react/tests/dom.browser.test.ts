import { test, expect, vi } from 'vitest';
import {
	getFormElement,
	getSubmitEvent,
	initializeField,
	getRadioGroupValue,
	getCheckboxGroupValue,
	resolveControlPayload,
	createDefaultPayload,
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

test('getRadioGroupValue', () => {
	const radio1 = document.createElement('input');
	radio1.type = 'radio';
	radio1.value = 'option1';
	radio1.checked = false;

	const radio2 = document.createElement('input');
	radio2.type = 'radio';
	radio2.value = 'option2';
	radio2.checked = true;

	const radio3 = document.createElement('input');
	radio3.type = 'radio';
	radio3.value = 'option3';
	radio3.checked = false;

	expect(getRadioGroupValue([radio1, radio2, radio3])).toBe('option2');
	expect(getRadioGroupValue([radio1, radio3])).toBeUndefined();
	expect(getRadioGroupValue([])).toBeUndefined();
});

test('getCheckboxGroupValue', () => {
	const checkbox1 = document.createElement('input');
	checkbox1.type = 'checkbox';
	checkbox1.value = 'option1';
	checkbox1.checked = true;

	const checkbox2 = document.createElement('input');
	checkbox2.type = 'checkbox';
	checkbox2.value = 'option2';
	checkbox2.checked = false;

	const checkbox3 = document.createElement('input');
	checkbox3.type = 'checkbox';
	checkbox3.value = 'option3';
	checkbox3.checked = true;

	expect(getCheckboxGroupValue([checkbox1, checkbox2, checkbox3])).toEqual([
		'option1',
		'option3',
	]);
	expect(getCheckboxGroupValue([checkbox2])).toEqual([]);
	expect(getCheckboxGroupValue([])).toBeUndefined();
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

test('createDefaultPayload', () => {
	// Test checkbox/radio with value and defaultChecked
	expect(createDefaultPayload({ defaultChecked: true, value: 'custom' })).toBe(
		'custom',
	);
	expect(createDefaultPayload({ defaultChecked: false })).toBe(null);

	// Test string defaultValue
	expect(createDefaultPayload({ defaultValue: 'test string' })).toBe(
		'test string',
	);

	// Test string array (for select multiple)
	expect(
		createDefaultPayload({ defaultValue: ['option1', 'option2'] }),
	).toEqual(['option1', 'option2']);

	// Test File array
	const file1 = new File(['test1'], 'test1.txt');
	const file2 = new File(['test2'], 'test2.txt');
	expect(createDefaultPayload({ defaultValue: [file1, file2] })).toEqual([
		file1,
		file2,
	]);

	// Test single File
	const file = new File(['test'], 'test.txt');
	expect(createDefaultPayload({ defaultValue: file })).toEqual(file);

	// Test defaultPayload (complex objects)
	const payload = [{ id: '1', name: 'Alice' }];
	expect(createDefaultPayload({ defaultPayload: payload })).toEqual(payload);

	// Test null/undefined
	expect(createDefaultPayload({ defaultValue: null })).toBeNull();
	expect(createDefaultPayload(undefined)).toBeUndefined();
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
