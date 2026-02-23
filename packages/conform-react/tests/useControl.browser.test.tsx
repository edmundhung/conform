/// <reference types="@vitest/browser/matchers" />
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Locator, userEvent, server } from 'vitest/browser';
import { useControl } from '../future';
import { createFileList } from '@conform-to/dom';
import { useEffect } from 'react';

describe('future export: useControl', () => {
	function Form(props: { id?: string; children: React.ReactNode }) {
		return (
			<form id={props.id} onSubmit={(event) => event.preventDefault()}>
				{props.children}
				<button type="submit">Submit</button>
				<button type="reset">Reset</button>
			</form>
		);
	}

	function Input(props: {
		name?: string;
		type?: string;
		defaultValue?: string | string[];
		defaultChecked?: boolean;
		value?: string;
		label?: string;
		onRender?: (formElement: HTMLFormElement | null) => void;
		onChange?: (value: string | string[], checked?: boolean) => void;
		onBlur?: () => void;
		onFocus?: () => void;
		options?: string[];
		multiple?: boolean;
		preserveOptionsOrder?: boolean;
	}) {
		const baseName = `${props.name}-base`;
		const baseId = `${baseName}-${props.value}`;
		const controlName = `${props.name}-control`;
		const controlId = `${controlName}-${props.value}`;
		const control = useControl({
			defaultValue: props.defaultValue,
			defaultChecked: props.defaultChecked,
			value: props.value,
			preserveOptionsOrder: props.preserveOptionsOrder,
		});
		const onRender = props.onRender;

		useEffect(() => {
			if (onRender) {
				onRender(control.formRef.current);
			}
		}, [onRender, control.formRef]);

		return (
			<div>
				<label htmlFor={baseId}>
					{props.label ? `${props.label} (base)` : 'Base'}
				</label>
				{props.type === 'textarea' ? (
					<textarea
						id={baseId}
						name={baseName}
						ref={control.register}
						defaultValue={props.defaultValue}
						onChange={(event) => props.onChange?.(event.target.value)}
						onBlur={props.onBlur}
						onFocus={props.onFocus}
					/>
				) : props.type === 'select' ? (
					<select
						id={baseId}
						name={baseName}
						ref={control.register}
						defaultValue={props.defaultValue}
						onChange={(event) => {
							if (event.target instanceof HTMLSelectElement) {
								props.onChange?.(
									props.multiple
										? Array.from(event.target.selectedOptions).map(
												(option) => option.value,
											)
										: event.target.value,
								);
							}
						}}
						onBlur={props.onBlur}
						onFocus={props.onFocus}
						multiple={props.multiple}
						data-options={
							props.multiple ? control.options?.join(',') : undefined
						}
					>
						<option value="">Select an option</option>
					</select>
				) : (
					<input
						id={baseId}
						type={props.type}
						name={baseName}
						ref={control.register}
						defaultValue={props.defaultValue}
						defaultChecked={props.defaultChecked}
						value={props.value}
						onChange={(event) => {
							if (props.type === 'checkbox' || props.type === 'radio') {
								props.onChange?.(event.target.value, event.target.checked);
							} else if (props.type === 'file') {
								props.onChange?.(
									// We will only validate the file name as vitest wasn't able to assert the file objects in the input properly
									// e.g. await expect.poll(() => getFiles(baseInput)).toEqual([new File()]); will pass as long as the file input is not empty
									Array.from(event.target.files ?? []).map((file) => file.name),
								);
							} else {
								props.onChange?.(event.target.value);
							}
						}}
						onBlur={props.onBlur}
						onFocus={props.onFocus}
						multiple={props.multiple}
					/>
				)}
				<label htmlFor={controlId}>
					{props.label ? `${props.label} (control)` : 'Control'}
				</label>
				{props.type === 'checkbox' || props.type === 'radio' ? (
					<input
						id={controlId}
						name={controlName}
						type={props.type}
						value={props.value}
						checked={control.checked ?? false}
						onChange={(event) => control.change(event.target.checked)}
						onBlur={control.blur}
						onFocus={control.focus}
					/>
				) : props.type === 'textarea' ? (
					<textarea
						id={controlId}
						name={controlName}
						value={control.value ?? props.defaultValue}
						onChange={(event) => control.change(event.target.value)}
						onBlur={control.blur}
						onFocus={control.focus}
					/>
				) : props.type === 'select' ? (
					<select
						id={controlId}
						name={controlName}
						value={props.multiple ? control.options ?? [] : control.value ?? ''}
						onChange={(event) =>
							control.change(
								props.multiple
									? Array.from(event.target.selectedOptions).map(
											(option) => option.value,
										)
									: event.target.value,
							)
						}
						onBlur={control.blur}
						onFocus={control.focus}
						multiple={props.multiple}
					>
						<option value="">Select an option</option>
						{props.options?.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				) : (
					<input
						id={controlId}
						name={controlName}
						type={props.type}
						value={control.value ?? props.defaultValue}
						onChange={(event) =>
							control.change(
								props.type === 'file'
									? Array.from(event.target.files ?? [])
									: event.target.value,
							)
						}
						ref={(element) => {
							if (element && element.type === 'file') {
								element.files = createFileList(control.files ?? []);
							}
						}}
						onBlur={control.blur}
						onFocus={control.focus}
						multiple={props.multiple}
					/>
				)}
			</div>
		);
	}

	function getElement<C>(locator: Locator, ctor: new () => C): C {
		const element = locator.query();

		if (element instanceof ctor) {
			return element;
		}

		expect.fail(`Element should be an instance of ${ctor.name}`);
	}

	function getFiles(locator: Locator): File[] {
		const element = locator.query();

		if (element instanceof HTMLInputElement && element.type === 'file') {
			return Array.from(element.files ?? []);
		}

		throw new Error('Element not found');
	}

	// TODO: focus/blur event emulation fires inconsistently on firefox
	it.skipIf(server.browser === 'firefox')(
		'supports emulating focus and blur events',
		async () => {
			const focusHandler = vi.fn();
			const blurHandler = vi.fn();
			const screen = render(
				<Form>
					<Input
						type="text"
						defaultValue=""
						onFocus={focusHandler}
						onBlur={blurHandler}
					/>
				</Form>,
			);

			const controlInput = screen.getByLabelText('Control');

			expect(focusHandler).toBeCalledTimes(0);
			expect(blurHandler).toBeCalledTimes(0);

			await userEvent.click(controlInput);
			expect(focusHandler).toBeCalledTimes(1);
			expect(blurHandler).toBeCalledTimes(0);

			await userEvent.click(document.body);
			expect(focusHandler).toBeCalledTimes(1);
			expect(blurHandler).toBeCalledTimes(1);
		},
	);

	it('supports emulating a text input', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input type="text" defaultValue="" onChange={changeHandler} />
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');

		await expect.element(controlInput).toHaveValue('');

		await userEvent.type(controlInput, 'foo');

		expect(changeHandler).toHaveBeenNthCalledWith(1, 'f');
		expect(changeHandler).toHaveBeenNthCalledWith(2, 'fo');
		expect(changeHandler).toHaveBeenNthCalledWith(3, 'foo');

		await expect.element(baseInput).toHaveValue('foo');
		await expect.element(controlInput).toHaveValue('foo');

		await userEvent.click(resetButton);
		await expect.element(baseInput).toHaveValue('');
		await expect.element(controlInput).toHaveValue('');

		await userEvent.type(baseInput, 'bar');
		expect(changeHandler).toHaveBeenNthCalledWith(4, 'b');
		expect(changeHandler).toHaveBeenNthCalledWith(5, 'ba');
		expect(changeHandler).toHaveBeenNthCalledWith(6, 'bar');

		await expect.element(baseInput).toHaveValue('bar');
		await expect.element(controlInput).toHaveValue('bar');

		const input = getElement(baseInput, HTMLInputElement);

		input.value = 'hello world';
		await expect.element(baseInput).toHaveValue('hello world');
		await expect.element(controlInput).not.toHaveValue('hello world');

		input.dataset.conform = 'test';
		await expect.element(baseInput).toHaveValue('hello world');
		await expect.element(controlInput).toHaveValue('hello world');
	});

	it('supports emulating a checkbox', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input
					type="checkbox"
					defaultChecked={false}
					value="on"
					onChange={changeHandler}
				/>
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');

		await userEvent.click(controlInput);
		await expect.element(baseInput).toBeChecked();
		expect(changeHandler).toHaveBeenNthCalledWith(1, 'on', true);

		await userEvent.click(controlInput);
		await expect.element(baseInput).not.toBeChecked();
		expect(changeHandler).toHaveBeenNthCalledWith(2, 'on', false);

		const input = getElement(baseInput, HTMLInputElement);

		input.checked = true;
		await expect.element(controlInput).not.toBeChecked();

		input.dataset.conform = 'test';
		await expect.element(controlInput).toBeChecked();

		await userEvent.click(resetButton);
		await expect.element(controlInput).not.toBeChecked();
	});

	it('supports emulating a radio button', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input
					type="radio"
					name="flag"
					value="yes"
					label="Yes"
					onChange={changeHandler}
				/>
				<Input
					type="radio"
					name="flag"
					value="no"
					label="No"
					onChange={changeHandler}
				/>
			</Form>,
		);

		const yesBaseInput = screen.getByLabelText('Yes (base)');
		const noBaseInput = screen.getByLabelText('No (base)');
		const yesControlInput = screen.getByLabelText('Yes (control)');
		const noControlInput = screen.getByLabelText('No (control)');
		const resetButton = screen.getByText('Reset');

		await expect.element(yesControlInput).not.toBeChecked();
		await expect.element(noControlInput).not.toBeChecked();

		await userEvent.click(yesControlInput);
		await expect.element(yesControlInput).toBeChecked();
		await expect.element(noControlInput).not.toBeChecked();

		expect(changeHandler).toHaveBeenNthCalledWith(1, 'yes', true);

		await userEvent.click(noBaseInput);
		await expect.element(yesControlInput).not.toBeChecked();
		await expect.element(noControlInput).toBeChecked();

		await userEvent.click(resetButton);

		await expect.element(yesControlInput).not.toBeChecked();
		await expect.element(noControlInput).not.toBeChecked();

		const yesInputElement = getElement(yesBaseInput, HTMLInputElement);

		yesInputElement.checked = true;
		await expect.element(yesBaseInput).toBeChecked();
		await expect.element(noBaseInput).not.toBeChecked();
		await expect.element(yesControlInput).not.toBeChecked();
		await expect.element(noControlInput).not.toBeChecked();

		yesInputElement.dataset.conform = 'test';
		await expect.element(yesBaseInput).toBeChecked();
		await expect.element(noBaseInput).not.toBeChecked();
		await expect.element(yesControlInput).toBeChecked();
		await expect.element(noControlInput).not.toBeChecked();
	});

	it('supports emulating a select', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input
					type="select"
					defaultValue=""
					onChange={changeHandler}
					options={['foo', 'bar']}
				/>
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');

		const controlElement = getElement(controlInput, HTMLSelectElement);

		await expect.element(controlInput).toHaveValue('');

		await userEvent.selectOptions(controlElement, 'foo');
		await expect.element(baseInput).toHaveValue('foo');
		await expect.element(controlInput).toHaveValue('foo');

		expect(changeHandler).toHaveBeenNthCalledWith(1, 'foo');

		await userEvent.click(resetButton);
		await expect.element(baseInput).toHaveValue('');
		await expect.element(controlInput).toHaveValue('');

		await userEvent.selectOptions(controlElement, 'bar');
		expect(changeHandler).toHaveBeenNthCalledWith(2, 'bar');

		await expect.element(baseInput).toHaveValue('bar');
		await expect.element(controlInput).toHaveValue('bar');

		const baseElement = getElement(baseInput, HTMLSelectElement);

		baseElement.selectedIndex = 1;
		await expect.element(baseInput).toHaveValue('foo');
		await expect.element(controlInput).toHaveValue('bar');

		baseElement.dataset.conform = 'test';
		await expect.element(baseInput).toHaveValue('foo');
		await expect.element(controlInput).toHaveValue('foo');
	});

	it('supports emulating a file input', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input type="file" onChange={changeHandler} />
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');
		const txtFile = new File(['hello world'], 'example.txt', {
			type: 'text/plain',
		});
		const sqlFile = new File(['CREATE TABLE users;'], 'schema.sql', {
			type: 'application/sql',
		});

		await expect.poll(() => getFiles(controlInput)).toEqual([]);

		await userEvent.upload(controlInput, txtFile);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([txtFile.name]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([txtFile.name]);

		expect(changeHandler).toHaveBeenNthCalledWith(1, [txtFile.name]);

		await userEvent.click(resetButton);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([]);

		await userEvent.upload(baseInput, sqlFile);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([sqlFile.name]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([sqlFile.name]);

		expect(changeHandler).toHaveBeenNthCalledWith(2, [sqlFile.name]);

		const baseElement = getElement(baseInput, HTMLInputElement);

		baseElement.files = createFileList([]);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([sqlFile.name]);

		baseElement.dataset.conform = 'test';
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([]);
	});

	it('supports emulating a multiple file input', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input type="file" onChange={changeHandler} multiple />
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');
		const txtFile = new File(['hello world'], 'example.txt', {
			type: 'text/plain',
		});
		const sqlFile = new File(['CREATE TABLE users;'], 'schema.sql', {
			type: 'application/sql',
		});
		const csvFile = new File(['name,email'], 'users.csv', {
			type: 'text/csv',
		});

		await expect.poll(() => getFiles(controlInput)).toEqual([]);

		await userEvent.upload(controlInput, [txtFile, sqlFile]);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([txtFile.name, sqlFile.name]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([txtFile.name, sqlFile.name]);

		expect(changeHandler).toHaveBeenNthCalledWith(1, [
			txtFile.name,
			sqlFile.name,
		]);

		await userEvent.click(resetButton);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([]);

		const baseElement = getElement(baseInput, HTMLInputElement);

		baseElement.files = createFileList([csvFile, sqlFile]);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([csvFile.name, sqlFile.name]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([]);

		baseElement.dataset.conform = 'test';
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([csvFile.name, sqlFile.name]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([csvFile.name, sqlFile.name]);

		// Clearing the file input by uploading nothing
		await userEvent.upload(controlInput, []);
		await expect
			.poll(() => getFiles(baseInput).map((file) => file.name))
			.toEqual([]);
		await expect
			.poll(() => getFiles(controlInput).map((file) => file.name))
			.toEqual([]);
	});

	it('supports emulating a multiple select', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input
					type="select"
					defaultValue={[]}
					onChange={changeHandler}
					options={['foo', 'bar', 'baz']}
					multiple
				/>
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');

		const controlElement = getElement(controlInput, HTMLSelectElement);

		await expect.element(controlInput).toHaveValue([]);

		await userEvent.selectOptions(controlElement, 'foo');

		expect(changeHandler).toHaveBeenNthCalledWith(1, ['foo']);

		await expect.element(baseInput).toHaveValue(['foo']);
		await expect.element(controlInput).toHaveValue(['foo']);

		await userEvent.click(resetButton);
		await expect.element(baseInput).toHaveValue([]);
		await expect.element(controlInput).toHaveValue([]);

		await userEvent.selectOptions(controlElement, ['bar', 'baz']);
		expect(changeHandler).toHaveBeenNthCalledWith(2, ['bar', 'baz']);

		await expect.element(baseInput).toHaveValue(['bar', 'baz']);
		await expect.element(controlInput).toHaveValue(['bar', 'baz']);

		const baseElement = getElement(baseInput, HTMLSelectElement);

		for (const option of baseElement.options) {
			option.selected = ['foo', 'baz'].includes(option.value);
		}
		await expect.element(baseInput).toHaveValue(['foo', 'baz']);
		await expect.element(controlInput).toHaveValue(['bar', 'baz']);

		baseElement.dataset.conform = 'test';
		await expect.element(baseInput).toHaveValue(['foo', 'baz']);
		await expect.element(controlInput).toHaveValue(['foo', 'baz']);

		// Verify values are returned in DOM order, not selection order
		// (selecting 'baz' then 'bar' should still return ['bar', 'baz'])
		await expect.element(baseInput).toHaveAttribute('data-options', 'foo,baz');
	});

	it('supports emulating a textarea', async () => {
		const changeHandler = vi.fn();
		const screen = render(
			<Form>
				<Input type="textarea" onChange={changeHandler} defaultValue="" />
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const resetButton = screen.getByText('Reset');

		await expect.element(controlInput).toHaveValue('');

		await userEvent.type(controlInput, 'foo');

		expect(changeHandler).toHaveBeenNthCalledWith(1, 'f');
		expect(changeHandler).toHaveBeenNthCalledWith(2, 'fo');
		expect(changeHandler).toHaveBeenNthCalledWith(3, 'foo');

		await expect.element(baseInput).toHaveValue('foo');
		await expect.element(controlInput).toHaveValue('foo');

		await userEvent.click(resetButton);
		await expect.element(baseInput).toHaveValue('');
		await expect.element(controlInput).toHaveValue('');

		await userEvent.type(baseInput, 'bar');
		expect(changeHandler).toHaveBeenNthCalledWith(4, 'b');
		expect(changeHandler).toHaveBeenNthCalledWith(5, 'ba');
		expect(changeHandler).toHaveBeenNthCalledWith(6, 'bar');

		await expect.element(baseInput).toHaveValue('bar');
		await expect.element(controlInput).toHaveValue('bar');

		const input = getElement(baseInput, HTMLTextAreaElement);

		input.value = 'hello world';
		await expect.element(baseInput).toHaveValue('hello world');
		await expect.element(controlInput).not.toHaveValue('hello world');

		input.dataset.conform = 'test';
		await expect.element(baseInput).toHaveValue('hello world');
		await expect.element(controlInput).toHaveValue('hello world');
	});

	it('supports resetting the input after initialized with a different default value', async () => {
		const changeHandler = vi.fn();

		function TestComponent() {
			const control = useControl({
				defaultValue: 'Hello',
			});
			return (
				<div onChange={changeHandler}>
					<button
						type="button"
						aria-label="reset button"
						onClick={() => control.change('')}
					>
						Reset
					</button>
					<input aria-label="base input" ref={control.register} type="text" />
				</div>
			);
		}

		const screen = render(
			<Form>
				<TestComponent />
			</Form>,
		);

		const baseInput = screen.getByLabelText('base input');
		const resetButton = screen.getByLabelText('reset button');

		// Verify initial value
		await expect.element(baseInput).toHaveValue('Hello');

		// Click reset button which calls control.change('')
		await userEvent.click(resetButton);

		// Value should be empty
		await expect.element(baseInput).toHaveValue('');

		// onChange should have fired
		expect(changeHandler).toHaveBeenCalled();
	});

	it('provides access to the associated form via formRef', async () => {
		const handleRender = vi.fn();
		render(
			<Form id="example">
				<Input onRender={handleRender} defaultValue="" />
			</Form>,
		);

		await vi.waitFor(() => {
			expect(handleRender).toHaveBeenCalled();
		});

		// Verify the formRef is the actual form element
		expect(handleRender).toHaveBeenCalledWith(
			document.forms.namedItem('example'),
		);
	});

	it('preserves DOM defaultValue when no value is provided to useControl', async () => {
		function InputWithDOMDefaultValue() {
			const control = useControl();
			return (
				<div>
					<input
						aria-label="base input"
						ref={control.register}
						defaultValue="Hello World"
					/>
					<input
						aria-label="control input"
						value={control.value ?? ''}
						onChange={(e) => control.change(e.target.value)}
					/>
				</div>
			);
		}

		const screen = render(
			<Form>
				<InputWithDOMDefaultValue />
			</Form>,
		);

		const baseInput = screen.getByLabelText('base input');
		const controlInput = screen.getByLabelText('control input');

		await expect.element(baseInput).toHaveValue('Hello World');
		await expect.element(controlInput).toHaveValue('Hello World');
	});

	it('supports preserveOptionsOrder for multi-select', async () => {
		const screen = render(
			<Form>
				<Input
					type="select"
					defaultValue={['c', 'a', 'b']}
					options={['a', 'b', 'c']}
					multiple
					preserveOptionsOrder
				/>
			</Form>,
		);

		const baseInput = screen.getByLabelText('Base');
		const controlInput = screen.getByLabelText('Control');
		const controlElement = getElement(controlInput, HTMLSelectElement);
		const resetButton = screen.getByText('Reset');

		// Initial order should be preserved (not DOM order ['a', 'b', 'c'])
		await expect.element(baseInput).toHaveAttribute('data-options', 'c,a,b');

		// Change order via control select - order follows the value array passed to change()
		await userEvent.selectOptions(controlElement, ['b', 'c']);
		await expect.element(baseInput).toHaveAttribute('data-options', 'b,c');

		// After reset, order should be restored to defaultValue order
		await userEvent.click(resetButton);
		await expect.element(baseInput).toHaveAttribute('data-options', 'c,a,b');
	});
});
