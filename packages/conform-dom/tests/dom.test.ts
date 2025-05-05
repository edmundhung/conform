import { describe, it, expect, vi } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import {
	getFieldValue,
	updateFieldValue,
	createGlobalFormsObserver,
	change,
	focus,
	blur,
	createFileList,
} from '../dom';

describe('getFieldValue', () => {
	it('supports text input', () => {
		const input = document.createElement('input');
		input.type = 'text';

		expect(getFieldValue(input)).toBe('');

		input.value = 'hello world';
		expect(getFieldValue(input)).toBe('hello world');
	});

	it('supports checkbox', () => {
		const input = document.createElement('input');
		input.type = 'checkbox';

		input.checked = true;
		expect(getFieldValue(input)).toBe('on');

		input.value = 'test';
		expect(getFieldValue(input)).toBe('test');

		input.checked = false;
		expect(getFieldValue(input)).toBe(null);
	});

	it('supports radio button', () => {
		const input = document.createElement('input');
		input.type = 'radio';

		input.checked = true;
		expect(getFieldValue(input)).toBe('on');

		input.value = 'test';
		expect(getFieldValue(input)).toBe('test');

		input.checked = false;
		expect(getFieldValue(input)).toBe(null);
	});

	it('supports file input', () => {
		const input = document.createElement('input');
		input.type = 'file';

		expect(getFieldValue(input)).toBe(null);

		const dataTransfer = new DataTransfer();
		const file = new File(['hello world'], 'example.txt', {
			type: 'text/plain',
		});
		dataTransfer.items.add(file);
		input.files = dataTransfer.files;

		expect(getFieldValue(input)).toEqual(file);

		input.multiple = true;
		expect(getFieldValue(input)).toEqual([file]);

		const file2 = new File(['SELECT * FROM users;'], 'example2.sql', {
			type: 'text/plain',
		});
		dataTransfer.items.add(file2);
		input.files = dataTransfer.files;
		expect(getFieldValue(input)).toEqual([file, file2]);
	});

	it('supports select', () => {
		const select = document.createElement('select');
		const emptyOption = document.createElement('option');
		emptyOption.value = '';
		const option1 = document.createElement('option');
		option1.value = 'option1';
		const option2 = document.createElement('option');
		option2.value = 'option2';
		const option3 = document.createElement('option');
		option3.value = 'option3';
		select.append(emptyOption, option1, option2, option3);

		expect(getFieldValue(select)).toBe('');

		select.value = 'option2';
		expect(getFieldValue(select)).toBe('option2');

		select.selectedIndex = -1;
		expect(getFieldValue(select)).toBe(null);

		select.multiple = true;
		expect(getFieldValue(select)).toEqual([]);

		select.value = 'option2';
		expect(getFieldValue(select)).toEqual(['option2']);

		option2.selected = false;
		option3.selected = true;
		option1.selected = true;
		expect(getFieldValue(select)).toEqual(['option1', 'option3']);
	});

	it('supports textarea', () => {
		const textarea = document.createElement('textarea');

		expect(getFieldValue(textarea)).toBe('');

		textarea.value = 'hello world';
		expect(getFieldValue(textarea)).toBe('hello world');
	});

	it('supports checkbox group', () => {
		const red = document.createElement('input');
		red.name = 'color';
		red.type = 'checkbox';
		red.value = 'red';

		const green = document.createElement('input');
		green.name = 'color';
		green.type = 'checkbox';
		green.value = 'green';

		const blue = document.createElement('input');
		blue.name = 'color';
		blue.type = 'checkbox';
		blue.value = 'blue';

		expect(getFieldValue([red, green, blue])).toEqual([]);

		green.checked = true;
		expect(getFieldValue([red, green, blue])).toEqual(['green']);

		red.checked = true;
		green.checked = false;
		blue.checked = true;

		expect(getFieldValue([red, green, blue])).toEqual(['red', 'blue']);
	});

	it('supports radio group', () => {
		const form = document.createElement('form');
		const red = document.createElement('input');
		red.name = 'color';
		red.type = 'radio';
		red.value = 'red';
		const green = document.createElement('input');
		green.name = 'color';
		green.type = 'radio';
		green.value = 'green';
		const blue = document.createElement('input');
		blue.name = 'color';
		blue.type = 'radio';
		blue.value = 'blue';
		form.append(red, green, blue);

		expect(getFieldValue([red, green, blue])).toBe(null);

		green.checked = true;
		expect(getFieldValue([red, green, blue])).toBe('green');

		blue.checked = true;
		expect(getFieldValue([red, green, blue])).toBe('blue');

		red.checked = true;
		expect(getFieldValue([red, green, blue])).toBe('red');
	});
});

describe('updateFieldValue', () => {
	it('supports text input', () => {
		const input = document.createElement('input');
		input.type = 'text';

		updateFieldValue(input, {
			value: 'foo',
		});
		expect(input.value).toBe('foo');
		expect(input.defaultValue).toBe('');

		updateFieldValue(input, {
			defaultValue: 'bar',
		});
		expect(input.value).toBe('foo');
		expect(input.defaultValue).toBe('bar');

		updateFieldValue(input, {
			value: null,
		});

		expect(input.value).toBe('');
		expect(input.defaultValue).toBe('bar');
	});

	it('supports checkbox', () => {
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.checked = false;

		updateFieldValue(input, {
			value: 'on',
		});

		expect(input.checked).toBe(true);

		input.value = 'test';
		input.checked = false;
		updateFieldValue(input, {
			value: 'test',
		});
		expect(input.checked).toBe(true);

		updateFieldValue(input, {
			defaultValue: 'test',
		});
		expect(input.checked).toBe(true);
		expect(input.defaultChecked).toBe(true);

		updateFieldValue(input, {
			value: null,
		});
		expect(input.checked).toBe(false);
		expect(input.defaultChecked).toBe(true);
	});

	it('supports radio button', () => {
		const input = document.createElement('input');
		input.type = 'radio';
		input.checked = false;

		updateFieldValue(input, {
			value: 'on',
		});

		expect(input.checked).toBe(true);

		input.value = 'test';
		input.checked = false;
		updateFieldValue(input, {
			value: 'test',
		});
		expect(input.checked).toBe(true);

		updateFieldValue(input, {
			defaultValue: 'test',
		});
		expect(input.checked).toBe(true);
		expect(input.defaultChecked).toBe(true);

		updateFieldValue(input, {
			value: null,
		});
		expect(input.checked).toBe(false);
		expect(input.defaultChecked).toBe(true);
	});

	it('supports file input', () => {
		const input = document.createElement('input');
		input.type = 'file';

		const file = new File(['hello world'], 'example.txt', {
			type: 'text/plain',
		});

		updateFieldValue(input, {
			value: file,
		});

		expect(input.files?.[0]).toEqual(file);
		expect(input.files?.length).toBe(1);

		input.multiple = true;

		const file2 = new File(['SELECT * FROM users;'], 'example2.sql', {
			type: 'text/plain',
		});
		updateFieldValue(input, {
			value: [file, file2],
		});

		expect(input.files?.[0]).toEqual(file);
		expect(input.files?.[1]).toEqual(file2);
		expect(input.files?.length).toBe(2);

		updateFieldValue(input, {
			value: null,
		});
		expect(input.files?.length).toBe(0);

		updateFieldValue(input, {
			value: createFileList([file, file2]),
		});
		expect(input.files?.[0]).toEqual(file);
		expect(input.files?.[1]).toEqual(file2);
		expect(input.files?.length).toBe(2);
	});

	it('supports select', () => {
		const select = document.createElement('select');
		const emptyOption = document.createElement('option');
		emptyOption.value = '';
		const option1 = document.createElement('option');
		option1.value = 'option1';
		const option2 = document.createElement('option');
		option2.value = 'option2';

		select.append(emptyOption, option1, option2);

		updateFieldValue(select, {
			value: 'option2',
		});
		expect(select.selectedIndex).toBe(2);

		updateFieldValue(select, {
			value: null,
		});
		expect(select.selectedIndex).toBe(-1);

		select.multiple = true;
		updateFieldValue(select, {
			value: ['option1', 'option2'],
		});
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(true);
		expect(select.options.item(2)?.selected).toBe(true);
		expect(select.options.length).toBe(3);

		updateFieldValue(select, {
			value: ['option3', 'option1'],
		});
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(true);
		expect(select.options.item(2)?.selected).toBe(false);
		expect(select.options.item(3)?.selected).toBe(true);
		expect(select.options.length).toBe(4);

		updateFieldValue(select, {
			defaultValue: 'option2',
		});
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(true);
		expect(select.options.item(2)?.selected).toBe(false);
		expect(select.options.item(3)?.selected).toBe(true);
		expect(select.options.item(0)?.defaultSelected).toBe(false);
		expect(select.options.item(1)?.defaultSelected).toBe(false);
		expect(select.options.item(2)?.defaultSelected).toBe(true);
		expect(select.options.item(3)?.defaultSelected).toBe(false);

		updateFieldValue(select, {
			value: null,
		});
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(false);
		expect(select.options.item(2)?.selected).toBe(false);
		expect(select.options.item(3)?.selected).toBe(false);
		expect(select.options.item(0)?.defaultSelected).toBe(false);
		expect(select.options.item(1)?.defaultSelected).toBe(false);
		expect(select.options.item(2)?.defaultSelected).toBe(true);
		expect(select.options.item(3)?.defaultSelected).toBe(false);
	});

	it('supports textarea', () => {
		const textarea = document.createElement('textarea');

		updateFieldValue(textarea, {
			value: 'foo',
		});
		expect(textarea.value).toBe('foo');
		expect(textarea.defaultValue).toBe('');

		updateFieldValue(textarea, {
			defaultValue: 'bar',
		});
		expect(textarea.value).toBe('foo');
		expect(textarea.defaultValue).toBe('bar');

		updateFieldValue(textarea, {
			value: null,
		});
		expect(textarea.value).toBe('');
		expect(textarea.defaultValue).toBe('bar');
	});
});

describe('createFileList', () => {
	it('creates a file list that can update the value of a file input', () => {
		const file1 = new File(['hello world'], 'example.txt', {
			type: 'text/plain',
		});
		const file2 = new File(['SELECT * FROM users;'], 'example2.sql', {
			type: 'text/plain',
		});

		const fileList = createFileList([file1, file2]);

		expect(fileList).toBeInstanceOf(FileList);
		expect(fileList[0]).toEqual(file1);
		expect(fileList[1]).toEqual(file2);
		expect(fileList.length).toBe(2);

		const input = document.createElement('input');
		input.type = 'file';
		input.files = fileList;

		expect(input.files[0]).toEqual(file1);
		expect(input.files[1]).toEqual(file2);
		expect(input.files.length).toBe(2);
	});
});

describe('createGlobalFormsObserver', () => {
	it('listen to input event', async (ctx) => {
		const observer = createGlobalFormsObserver();
		const form = document.createElement('form');
		const input = document.createElement('input');
		const textarea = document.createElement('textarea');

		form.append(input, textarea);
		document.body.append(form);

		const formListener = vi.fn();
		const fieldListener = vi.fn();
		ctx.onTestFinished(observer.onFormUpdate(formListener));
		ctx.onTestFinished(observer.onFieldUpdate(fieldListener));

		await userEvent.type(input, 'example');
		expect(formListener).toBeCalledWith({
			type: 'input',
			target: form,
		});
		expect(fieldListener).toBeCalledWith({
			type: 'input',
			target: input,
		});
	});

	it('listen to reset event', async (ctx) => {
		const observer = createGlobalFormsObserver();
		const form = document.createElement('form');
		const input = document.createElement('input');
		const textarea = document.createElement('textarea');
		const resetButton = document.createElement('button');
		resetButton.type = 'reset';
		form.append(input, textarea, resetButton);
		document.body.append(form);

		const formListener = vi.fn();
		const fieldListener = vi.fn();
		ctx.onTestFinished(observer.onFormUpdate(formListener));
		ctx.onTestFinished(observer.onFieldUpdate(fieldListener));

		await userEvent.click(resetButton);
		expect(formListener).toBeCalledWith({
			type: 'reset',
			target: form,
		});
		expect(fieldListener).toBeCalledWith({
			type: 'reset',
			target: input,
		});
	});

	it('listen to form submit', async (ctx) => {
		const observer = createGlobalFormsObserver();
		const form = document.createElement('form');
		const input = document.createElement('input');
		const textarea = document.createElement('textarea');
		const submitButton = document.createElement('button');
		const submitHandler = (event: SubmitEvent) => event.preventDefault();
		form.append(input, textarea, submitButton);
		form.addEventListener('submit', submitHandler);
		document.body.append(form);

		const formListener = vi.fn();
		const fieldListener = vi.fn();
		ctx.onTestFinished(observer.onFormUpdate(formListener));
		ctx.onTestFinished(observer.onFieldUpdate(fieldListener));
		ctx.onTestFinished(() => form.removeEventListener('submit', submitHandler));

		await userEvent.click(submitButton);
		expect(formListener).toBeCalledWith({
			type: 'submit',
			target: form,
			submitter: submitButton,
		});
		expect(fieldListener).not.toBeCalled();
	});

	it('observe dom mutation', async (ctx) => {
		const observer = createGlobalFormsObserver();
		const form = document.createElement('form');
		const input = document.createElement('input');
		const textarea = document.createElement('textarea');

		form.append(input, textarea);
		document.body.append(form);

		const formListener = vi.fn();
		const fieldListener = vi.fn();
		ctx.onTestFinished(observer.onFormUpdate(formListener));
		ctx.onTestFinished(observer.onFieldUpdate(fieldListener));

		input.dataset.conform = 'exmaple';

		await vi.waitFor(() => {
			expect(formListener).toBeCalledWith({
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toBeCalledWith({
				type: 'mutation',
				target: input,
			});
		});
	});
});

describe('change', () => {
	it('dispatch input and change events', async (ctx) => {
		const input = document.createElement('input');
		const handler = vi.fn();
		const handleEvent = (event: Event) => {
			if (event.target !== input) {
				expect.fail('Event target is not the input element');
			}
			handler(event.type, input.value, event.bubbles);
		};

		input.addEventListener('change', handleEvent);
		input.addEventListener('input', handleEvent);
		ctx.onTestFinished(() => input.removeEventListener('change', handleEvent));
		ctx.onTestFinished(() => input.removeEventListener('input', handleEvent));

		change(input, 'example');

		expect(handler).toHaveBeenNthCalledWith(1, 'input', 'example', true);
		expect(handler).toHaveBeenNthCalledWith(2, 'change', 'example', true);
		expect(input.value).toBe('example');
	});
});

describe('focus', () => {
	it('dispatch focus and focusin events', async (ctx) => {
		const input = document.createElement('input');
		const handler = vi.fn();
		const handleEvent = (event: Event) => {
			if (event.target !== input) {
				expect.fail('Event target is not the input element');
			}
			handler(event.type, event.bubbles);
		};

		input.addEventListener('focus', handleEvent);
		input.addEventListener('focusin', handleEvent);
		ctx.onTestFinished(() => input.removeEventListener('focus', handleEvent));
		ctx.onTestFinished(() => input.removeEventListener('focusin', handleEvent));

		focus(input);

		expect(handler).toHaveBeenNthCalledWith(1, 'focusin', true);
		expect(handler).toHaveBeenNthCalledWith(2, 'focus', false);
	});
});

describe('blur', () => {
	it('dispatch focus and focusin events', async (ctx) => {
		const input = document.createElement('input');
		const handler = vi.fn();
		const handleEvent = (event: Event) => {
			if (event.target !== input) {
				expect.fail('Event target is not the input element');
			}
			handler(event.type, event.bubbles);
		};

		input.addEventListener('focusout', handleEvent);
		input.addEventListener('blur', handleEvent);
		ctx.onTestFinished(() =>
			input.removeEventListener('focusout', handleEvent),
		);
		ctx.onTestFinished(() => input.removeEventListener('blur', handleEvent));

		blur(input);

		expect(handler).toHaveBeenNthCalledWith(1, 'focusout', true);
		expect(handler).toHaveBeenNthCalledWith(2, 'blur', false);
	});
});
