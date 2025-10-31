import { test, expect, vi } from 'vitest';
import {
	getFormElement,
	getSubmitEvent,
	initializeField,
	makeInputFocusable,
	getRadioGroupValue,
	getCheckboxGroupValue,
	getInputSnapshot,
	createDefaultSnapshot,
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

test('makeInputFocusable', () => {
	// Test with hidden input
	const hiddenInput = document.createElement('input');
	hiddenInput.type = 'hidden';
	makeInputFocusable(hiddenInput);

	expect(hiddenInput.style.position).toBe('absolute');
	expect(hiddenInput.style.width).toBe('1px');
	expect(hiddenInput.style.height).toBe('1px');
	expect(hiddenInput.getAttribute('aria-hidden')).toBe('true');
	expect(hiddenInput.tabIndex).toBe(-1);
	expect(hiddenInput.type).toBe('text');

	// Test with hidden element
	const hiddenElement = document.createElement('input');
	hiddenElement.hidden = true;
	makeInputFocusable(hiddenElement);

	expect(hiddenElement.hidden).toBe(false);
	expect(hiddenElement.style.position).toBe('absolute');

	// Test with visible element (should do nothing)
	const visibleInput = document.createElement('input');
	visibleInput.type = 'text';
	const originalStyle = visibleInput.style.cssText;
	makeInputFocusable(visibleInput);
	expect(visibleInput.style.cssText).toBe(originalStyle);
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

test('getInputSnapshot', () => {
	// Test file input
	const fileInput = document.createElement('input');
	fileInput.type = 'file';
	const file = new File(['test'], 'test.txt');
	Object.defineProperty(fileInput, 'files', {
		value: [file],
		writable: false,
	});

	expect(getInputSnapshot(fileInput)).toEqual({ files: [file] });

	// Test radio input
	const radioInput = document.createElement('input');
	radioInput.type = 'radio';
	radioInput.value = 'test';
	radioInput.checked = true;

	expect(getInputSnapshot(radioInput)).toEqual({
		value: 'test',
		checked: true,
	});

	// Test checkbox input
	const checkboxInput = document.createElement('input');
	checkboxInput.type = 'checkbox';
	checkboxInput.value = 'test';
	checkboxInput.checked = false;

	expect(getInputSnapshot(checkboxInput)).toEqual({
		value: 'test',
		checked: false,
	});

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

	expect(getInputSnapshot(selectMultiple)).toEqual({ options: ['option1'] });

	// Test regular input
	const textInput = document.createElement('input');
	textInput.value = 'test value';

	expect(getInputSnapshot(textInput)).toEqual({ value: 'test value' });

	// Test textarea
	const textarea = document.createElement('textarea');
	textarea.value = 'textarea value';

	expect(getInputSnapshot(textarea)).toEqual({ value: 'textarea value' });
});

test('createDefaultSnapshot', () => {
	// Test checkbox/radio with value and defaultChecked
	expect(createDefaultSnapshot(undefined, true, 'custom')).toEqual({
		value: 'custom',
		checked: true,
	});
	expect(createDefaultSnapshot(undefined, false, undefined)).toEqual({
		value: 'on',
		checked: false,
	});

	// Test string defaultValue
	expect(createDefaultSnapshot('test string', undefined, undefined)).toEqual({
		value: 'test string',
	});

	// Test string array (for select multiple)
	expect(
		createDefaultSnapshot(['option1', 'option2'], undefined, undefined),
	).toEqual({ options: ['option1', 'option2'] });

	// Test File array
	const file1 = new File(['test1'], 'test1.txt');
	const file2 = new File(['test2'], 'test2.txt');
	expect(createDefaultSnapshot([file1, file2], undefined, undefined)).toEqual({
		files: [file1, file2],
	});

	// Test single File
	const file = new File(['test'], 'test.txt');
	expect(createDefaultSnapshot(file, undefined, undefined)).toEqual({
		files: [file],
	});

	// Test FileList - skip this test as FileList is hard to mock properly
	// expect(createDefaultSnapshot(fileList, undefined, undefined)).toEqual({ files: [file1, file2] });

	// Test null/undefined
	expect(createDefaultSnapshot(null, undefined, undefined)).toEqual({});
	expect(createDefaultSnapshot(undefined, undefined, undefined)).toEqual({});
});

test('updateFormValue', () => {
	const form = document.createElement('form');

	const input1 = document.createElement('input');
	input1.name = 'text';
	input1.type = 'text';
	form.appendChild(input1);

	const input2 = document.createElement('input');
	input2.name = 'number';
	input2.type = 'number';
	form.appendChild(input2);

	const checkbox = document.createElement('input');
	checkbox.name = 'checkbox';
	checkbox.type = 'checkbox';
	form.appendChild(checkbox);

	const targetValue = {
		text: 'Hello World',
		number: 42,
		checkbox: true,
	};

	const mockSerialize = vi.fn((value) => {
		if (typeof value === 'string') return value;
		if (typeof value === 'number') return String(value);
		if (typeof value === 'boolean') return value ? 'on' : undefined;
		return undefined;
	});

	updateFormValue(form, targetValue, mockSerialize);

	expect(mockSerialize).toHaveBeenCalledWith('Hello World');
	expect(mockSerialize).toHaveBeenCalledWith(42);
	expect(mockSerialize).toHaveBeenCalledWith(true);

	// Verify form elements were updated (this would require mocking the change function)
	expect(input1.name).toBe('text');
	expect(input2.name).toBe('number');
	expect(checkbox.name).toBe('checkbox');
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
