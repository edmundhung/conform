import { test, describe, it, expect, vi } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import {
	updateField,
	createGlobalFormsObserver,
	change,
	focus,
	blur,
	createFileList,
	isFieldElement,
	isGlobalInstance,
} from '../dom';

describe('updateField', () => {
	it('supports text input', () => {
		const input = document.createElement('input');
		input.type = 'text';

		updateField(input, {
			value: 'foo',
			defaultValue: 'foo',
		});
		expect(input.value).toBe('foo');
		expect(input.defaultValue).toBe('foo');

		updateField(input, {
			value: null,
		});

		expect(input.value).toBe('');
		expect(input.defaultValue).toBe('foo');
	});

	it('supports checkbox', () => {
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.checked = false;

		updateField(input, {
			value: 'on',
		});

		expect(input.checked).toBe(true);

		input.value = 'test';
		input.checked = false;
		updateField(input, {
			value: 'test',
			defaultValue: 'test',
		});
		expect(input.checked).toBe(true);
		expect(input.defaultChecked).toBe(true);

		updateField(input, { value: null });
		expect(input.checked).toBe(false);
		expect(input.defaultChecked).toBe(true);
	});

	it('supports radio button', () => {
		const input = document.createElement('input');
		input.type = 'radio';
		input.checked = false;

		updateField(input, { value: 'on' });

		expect(input.checked).toBe(true);

		input.value = 'test';
		input.checked = false;
		updateField(input, {
			value: 'test',
			defaultValue: 'test',
		});
		expect(input.checked).toBe(true);
		expect(input.defaultChecked).toBe(true);

		updateField(input, { value: null });
		expect(input.checked).toBe(false);
		expect(input.defaultChecked).toBe(true);
	});

	it('supports file input', () => {
		const input = document.createElement('input');
		input.type = 'file';

		const emptyFile = new File([], '');
		const file = new File(['hello world'], 'example.txt', {
			type: 'text/plain',
		});

		updateField(input, { value: file });

		expect(input.files?.[0]).toEqual(file);
		expect(input.files?.length).toBe(1);

		input.multiple = true;

		const file2 = new File(['SELECT * FROM users;'], 'example2.sql', {
			type: 'text/plain',
		});
		updateField(input, { value: [file, file2] });

		expect(input.files?.[0]).toEqual(file);
		expect(input.files?.[1]).toEqual(file2);
		expect(input.files?.length).toBe(2);

		updateField(input, { value: null });
		expect(input.files?.length).toBe(0);

		updateField(input, { value: createFileList([file, file2]) });
		expect(input.files?.[0]).toEqual(file);
		expect(input.files?.[1]).toEqual(file2);
		expect(input.files?.length).toBe(2);

		updateField(input, { value: emptyFile });
		expect(input.files?.length).toBe(0);
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

		updateField(select, { value: 'option2' });
		expect(select.selectedIndex).toBe(2);

		updateField(select, { value: null });
		expect(select.selectedIndex).toBe(-1);

		select.multiple = true;
		updateField(select, { value: ['option1', 'option2'] });
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(true);
		expect(select.options.item(2)?.selected).toBe(true);
		expect(select.options.length).toBe(3);

		updateField(select, {
			value: ['option3', 'option1'],
			defaultValue: ['option3', 'option1'],
		});
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(true);
		expect(select.options.item(2)?.selected).toBe(false);
		expect(select.options.item(3)?.selected).toBe(true);
		expect(select.options.item(0)?.defaultSelected).toBe(false);
		expect(select.options.item(1)?.defaultSelected).toBe(true);
		expect(select.options.item(2)?.defaultSelected).toBe(false);
		expect(select.options.item(3)?.defaultSelected).toBe(true);
		expect(select.options.length).toBe(4);

		updateField(select, { value: null });
		expect(select.options.item(0)?.selected).toBe(false);
		expect(select.options.item(1)?.selected).toBe(false);
		expect(select.options.item(2)?.selected).toBe(false);
		expect(select.options.item(3)?.selected).toBe(false);
		expect(select.options.item(0)?.defaultSelected).toBe(false);
		expect(select.options.item(1)?.defaultSelected).toBe(true);
		expect(select.options.item(2)?.defaultSelected).toBe(false);
		expect(select.options.item(3)?.defaultSelected).toBe(true);
	});

	it('supports textarea', () => {
		const textarea = document.createElement('textarea');

		updateField(textarea, {
			value: 'hello world',
			defaultValue: 'hello world',
		});
		expect(textarea.value).toBe('hello world');
		expect(textarea.defaultValue).toBe('hello world');

		updateField(textarea, { value: null });
		expect(textarea.value).toBe('');
		expect(textarea.defaultValue).toBe('hello world');
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
	it('listens to input event', async (ctx) => {
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

	it('listens to reset event', async (ctx) => {
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

	it('listens to submit event', async (ctx) => {
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

	it('observe when the data-conform attribtute of the inputs change', async (ctx) => {
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

		form.dataset.conform = 'test';

		await vi.waitFor(() => {
			expect(formListener).not.toBeCalled();
			expect(fieldListener).not.toBeCalled();
		});

		input.dataset.conform = 'foo';

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: input,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: textarea,
			});
		});

		expect(formListener).toBeCalledTimes(1);
		expect(fieldListener).toBeCalledTimes(1);

		input.dataset.conform = 'bar';

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: input,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: textarea,
			});
		});

		expect(formListener).toBeCalledTimes(2);
		expect(fieldListener).toBeCalledTimes(2);
	});

	it('observe when the name attribtute of the inputs change', async (ctx) => {
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

		await vi.waitFor(() => {
			expect(formListener).not.toBeCalled();
			expect(fieldListener).not.toBeCalled();
		});

		textarea.name = 'foo';

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: textarea,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: input,
			});
		});

		expect(formListener).toBeCalledTimes(1);
		expect(fieldListener).toBeCalledTimes(1);

		textarea.name = 'bar';

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: textarea,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: input,
			});
		});

		expect(formListener).toBeCalledTimes(2);
		expect(fieldListener).toBeCalledTimes(2);
	});

	it('observe when the form attribtute of the inputs change', async (ctx) => {
		const observer = createGlobalFormsObserver();
		const form = document.createElement('form');
		const dummyForm = document.createElement('form');
		const input = document.createElement('input');
		const select = document.createElement('select');
		const option = document.createElement('option');

		option.value = 'foobar';
		select.append(option);

		dummyForm.id = 'dummy';
		form.append(input, select);
		document.body.append(form, dummyForm);

		const formListener = vi.fn();
		const fieldListener = vi.fn();
		ctx.onTestFinished(observer.onFormUpdate(formListener));
		ctx.onTestFinished(observer.onFieldUpdate(fieldListener));

		await vi.waitFor(() => {
			expect(formListener).not.toBeCalled();
			expect(fieldListener).not.toBeCalled();
		});

		select.setAttribute('form', 'dummy');

		await vi.waitFor(() => {
			expect(formListener).toBeCalledWith({
				type: 'mutation',
				target: form,
			});
			expect(formListener).toBeCalledWith({
				type: 'mutation',
				target: dummyForm,
			});
			expect(fieldListener).toBeCalledWith({
				type: 'mutation',
				target: select,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: input,
			});
		});

		expect(formListener).toBeCalledTimes(2);
		expect(fieldListener).toBeCalledTimes(1);

		select.removeAttribute('form');

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenNthCalledWith(3, {
				type: 'mutation',
				target: form,
			});
			expect(formListener).toHaveBeenNthCalledWith(4, {
				type: 'mutation',
				target: dummyForm,
			});
			expect(fieldListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: select,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: input,
			});
		});

		expect(formListener).toBeCalledTimes(4);
		expect(fieldListener).toBeCalledTimes(2);
	});

	it('observe when the inputs are added or removed from the DOM', async (ctx) => {
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

		expect(formListener).not.toBeCalled();
		expect(fieldListener).not.toBeCalled();

		form.removeChild(input);

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: input,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: textarea,
			});
		});

		expect(formListener).toBeCalledTimes(1);
		expect(fieldListener).toBeCalledTimes(1);

		form.appendChild(input);

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenNthCalledWith(2, {
				type: 'mutation',
				target: input,
			});
			expect(fieldListener).not.toBeCalledWith({
				type: 'mutation',
				target: textarea,
			});
		});

		expect(formListener).toBeCalledTimes(2);
		expect(fieldListener).toBeCalledTimes(2);
	});

	it('observe when the forms are added or removed from the DOM', async (ctx) => {
		const observer = createGlobalFormsObserver();
		const form = document.createElement('form');
		const emptyForm = document.createElement('form');
		const input = document.createElement('input');
		const textarea = document.createElement('textarea');

		form.append(input, textarea);
		document.body.append(form, emptyForm);

		const formListener = vi.fn();
		const fieldListener = vi.fn();
		ctx.onTestFinished(observer.onFormUpdate(formListener));
		ctx.onTestFinished(observer.onFieldUpdate(fieldListener));

		expect(formListener).not.toBeCalled();
		expect(fieldListener).not.toBeCalled();

		emptyForm.remove();

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: emptyForm,
			});
			expect(fieldListener).not.toBeCalled();
		});

		expect(formListener).toBeCalledTimes(1);
		expect(fieldListener).toBeCalledTimes(0);

		form.remove();

		await vi.waitFor(() => {
			expect(formListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: form,
			});
			expect(fieldListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: input,
			});
			expect(fieldListener).toHaveBeenCalledWith({
				type: 'mutation',
				target: textarea,
			});
		});

		expect(formListener).toBeCalledTimes(2);
		expect(fieldListener).toBeCalledTimes(2);
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

test('isGlobalInstance', () => {
	class CustomFile {
		name: string;
		contents: string[];
		constructor(contents: string[], name: string) {
			this.name = name;
			this.contents = contents;
		}
	}

	const file = new File(['hello', 'world'], 'example.txt');
	const fileList = createFileList([file]);
	const customFile = new CustomFile(['hello', 'world'], 'example.txt');

	expect(isGlobalInstance(null, 'File')).toBe(false);
	expect(isGlobalInstance(file, 'File')).toBe(true);
	vi.stubGlobal('File', null);
	expect(isGlobalInstance(file, 'File')).toBe(false);
	vi.stubGlobal('File', CustomFile);
	expect(isGlobalInstance(file, 'File')).toBe(false);
	expect(isGlobalInstance(customFile, 'File')).toBe(true);

	expect(isGlobalInstance(null, 'FileList')).toBe(false);
	expect(isGlobalInstance(fileList, 'FileList')).toBe(true);
	vi.stubGlobal('FileList', null);
	expect(isGlobalInstance(fileList, 'FileList')).toBe(false);
	vi.stubGlobal('FileList', CustomFile);
	expect(isGlobalInstance(fileList, 'FileList')).toBe(false);
	expect(isGlobalInstance(customFile, 'FileList')).toBe(true);
});

test('isFieldElement', () => {
	function createInput(type?: string) {
		const element = document.createElement('input');

		if (type) {
			element.type = type;
		}

		return element;
	}

	expect(isFieldElement(null)).toBe(false);
	expect(isFieldElement(createInput())).toBe(true);
	expect(isFieldElement(createInput('button'))).toBe(false);
});
