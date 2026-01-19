/// <reference types="@vitest/browser/matchers" />
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
import { useControl, useFormData } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { useRef, useState } from 'react';
import { parse } from '@conform-to/dom';

describe('future export: useFormData', () => {
	function useRenderCount(): number {
		const ref = useRef(0);
		return ++ref.current;
	}

	function Form(props: {
		id?: string;
		onSubmit?: React.FormEventHandler<HTMLFormElement>;
		acceptFiles?: boolean;
		select: (formData: FormData | URLSearchParams, lastResult: any) => any;
		children: React.ReactNode;
	}) {
		const formRef = useRef<HTMLFormElement>(null);
		const result = props.acceptFiles
			? // eslint-disable-next-line react-hooks/rules-of-hooks
				useFormData(
					formRef,
					props.select as (formData: FormData, lastResult: any) => any,
					{ acceptFiles: true },
				)
			: // eslint-disable-next-line react-hooks/rules-of-hooks
				useFormData(
					formRef,
					props.select as (formData: URLSearchParams, lastResult: any) => any,
				);
		const count = useRenderCount();
		const [showChildren, setShowChildren] = useState(true);

		return (
			<form
				id={props.id}
				ref={formRef}
				encType={props.acceptFiles ? 'multipart/form-data' : undefined}
				onSubmit={props.onSubmit ?? ((event) => event.preventDefault())}
			>
				<pre data-testid="count">{count}</pre>
				<pre data-testid="result">
					{result === undefined
						? '<undefined>'
						: typeof result === 'string'
							? result
							: result instanceof File
								? result.name === '' && result.size === 0
									? '<empty file>'
									: result.name
								: JSON.stringify(result)}
				</pre>
				{showChildren ? <div>{props.children}</div> : null}
				<button type="button" onClick={() => setShowChildren(!showChildren)}>
					Toggle children
				</button>
			</form>
		);
	}

	function ConformForm(props: {
		defaultValue?: Record<string, any>;
		updateValue?: Record<string, any>;
		select: (formData: FormData | URLSearchParams, lastResult: any) => any;
		children: React.ReactNode;
	}) {
		const [form] = useForm({
			defaultValue: props.defaultValue,
			onValidate({ formData }) {
				return parse(formData, {
					resolve(payload) {
						return { value: payload };
					},
				});
			},
			onSubmit(event) {
				event.preventDefault();
			},
		});

		return (
			<>
				<Form id={form.id} select={props.select} onSubmit={form.onSubmit}>
					{props.children}
				</Form>
				<button
					type="button"
					onClick={() => form.update({ value: props.updateValue })}
				>
					Update
				</button>
				<button type="button" onClick={() => form.reset()}>
					Reset
				</button>
			</>
		);
	}

	it('syncs the form value on mount', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData.get('example') ?? '',
		);
		const screen = render(
			<Form select={selector}>
				<input name="example" aria-label="Example" defaultValue="foobar" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');

		// Rendered twice: (1) default to undefined, (2) sync to "foobar"
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('foobar');
	});

	it('updates the formData when user types', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData.get('example') ?? '',
		);
		const screen = render(
			<Form select={selector}>
				<input name="example" aria-label="Example" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');

		// Rendered twice: (1) default to undefined, (2) sync to ""
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('');
		// Input value: "f"
		await userEvent.type(input, 'f');
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(result).toHaveTextContent('f');
		await expect.element(input).toHaveValue('f');
		// Input value: "fo"
		await userEvent.type(input, 'o');
		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('fo');
		await expect.element(input).toHaveValue('fo');
		// Input value: "foo"
		await userEvent.type(input, 'o');
		await expect.element(renderCount).toHaveTextContent(5);
		await expect.element(result).toHaveTextContent('foo');
		await expect.element(input).toHaveValue('foo');

		screen.rerender(
			<Form select={selector}>
				<input name="example" aria-label="Example" form="another" />
			</Form>,
		);

		await expect.element(renderCount).toHaveTextContent(7);
		await expect.element(result).toHaveTextContent('<undefined>');

		// Ignore the input value change as it is associated to a different form
		await userEvent.type(input, 'bar');
		await expect.element(renderCount).toHaveTextContent(7);
		await expect.element(result).toHaveTextContent('<undefined>');
	});

	it('updates the formData when DOM updates', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData.get('example') ?? '',
		);
		const screen = render(
			<Form select={selector}>
				<input name="example" aria-label="Example" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');
		const toggleButton = screen.getByText('Toggle children');

		// Rendered twice: (1) default to undefined, (2) sync to ""
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('');
		// Hide the input
		await userEvent.click(toggleButton);
		// Rendered once: formData still exists but field gone, selector returns ""
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(result).toHaveTextContent('');
		// Show the input again
		await userEvent.click(toggleButton);
		// Rendered once: selector still returns ""
		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('');
		// Update the input value in one go
		await userEvent.fill(input, 'bar');
		await expect.element(renderCount).toHaveTextContent(5);
		await expect.element(result).toHaveTextContent('bar');
		// Hide the input again
		await userEvent.click(toggleButton);
		// Rendered twice here: (1) unmount the input, (2) useFormData re-runs with "" (field gone)
		await expect.element(renderCount).toHaveTextContent(7);
		await expect.element(result).toHaveTextContent('');
	});

	it('updates the formData when form submit', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);
		const screen = render(
			<>
				<form id="dummy" onSubmit={(event) => event.preventDefault()} />
				<Form select={selector}>
					<input name="field" aria-label="Field" />
					<button name="example" value="test">
						Submit
					</button>
				</Form>
			</>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const submitButton = screen.getByRole('button', {
			name: 'Submit',
		});
		const input = screen.getByLabelText('Field');

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');
		await userEvent.fill(input, 'foo');
		// No re-render here as the formData did not change
		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');
		// Submit the form
		await userEvent.click(submitButton);
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('test');
		// Update the input value again
		await userEvent.fill(input, 'bar');
		// Re-rendered as the formData changed (No submitter value)
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(result).toHaveTextContent('');

		screen.rerender(
			<>
				<form id="dummy" onSubmit={(event) => event.preventDefault()} />
				<Form select={selector}>
					<input name="field" aria-label="Field" />
					<button name="example" value="test" form="dummy">
						Submit
					</button>
				</Form>
			</>,
		);

		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('');

		// Submit the form again (with a different form)
		await userEvent.click(submitButton);
		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('');
	});

	it('updates the formData when form reset', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);
		const screen = render(
			<>
				<form id="dummy" onSubmit={(event) => event.preventDefault()} />
				<Form select={selector}>
					<input name="example" aria-label="Example" defaultValue="foo" />
					<button type="reset">Reset</button>
				</Form>
			</>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');
		const resetButton = screen.getByRole('button', {
			name: 'Reset',
		});

		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('foo');
		await userEvent.fill(input, 'bar');
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(result).toHaveTextContent('bar');
		// Reset the form
		await userEvent.click(resetButton);
		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('foo');

		screen.rerender(
			<>
				<form id="dummy" onSubmit={(event) => event.preventDefault()} />
				<Form select={selector}>
					<input name="example" aria-label="Example" defaultValue="bar" />
					<button type="reset" form="dummy">
						Reset
					</button>
				</Form>
			</>,
		);

		await expect.element(renderCount).toHaveTextContent(5);
		await expect.element(result).toHaveTextContent('foo');

		// Reset the form again (with a different form)
		// This will reset to "bar" if it is resetting the original form
		await userEvent.click(resetButton);
		await expect.element(renderCount).toHaveTextContent(5);
		await expect.element(result).toHaveTextContent('foo');
	});

	it('updates the formData when the "name" attribute changes', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);
		const screen = render(
			<Form select={selector}>
				<input name="example" aria-label="Example" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');

		await userEvent.fill(input, 'foo');
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('foo');

		screen.rerender(
			<Form select={selector}>
				<input name="something-else" aria-label="Example" />
			</Form>,
		);

		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('');

		screen.rerender(
			<Form select={selector}>
				<input name="example" aria-label="Example" />
			</Form>,
		);

		await expect.element(renderCount).toHaveTextContent(6);
		await expect.element(result).toHaveTextContent('foo');
	});

	it('updates the formData when the "form" attribute changes', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);
		const screen = render(
			<>
				<form id="dummy" />
				<Form select={selector}>
					<input name="example" aria-label="Example" />
				</Form>
			</>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');

		await userEvent.fill(input, 'foo');
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('foo');

		screen.rerender(
			<>
				<form id="dummy" />
				<Form select={selector}>
					<input name="example" aria-label="Example" form="dummy" />
				</Form>
			</>,
		);

		// Rendered twice here: (1) update the form attribute, (2) useFormData re-runs
		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('');
	});

	it('updates the formData when the input is updated by `control.change()`', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);

		function CustomInput({
			name,
			...props
		}: Omit<React.HTMLProps<HTMLInputElement>, 'defaultValue'> & {
			defaultValue?: string | string[];
		}) {
			const control = useControl({
				defaultValue: props.defaultValue,
			});

			return (
				<>
					{/* Base input */}
					<input ref={control.register} name={name} />
					{/* Control input */}
					<input
						{...props}
						value={control.value ?? ''}
						onChange={(event) => control.change(event.target.value)}
					/>
				</>
			);
		}

		const screen = render(
			<Form select={selector}>
				<CustomInput name="example" aria-label="Example" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');
		// Input value: "f"
		await userEvent.type(input, 'f');
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('f');
		await expect.element(input).toHaveValue('f');
		// Input value: "fo"
		await userEvent.type(input, 'o');
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(result).toHaveTextContent('fo');
		await expect.element(input).toHaveValue('fo');
		// Input value: "foo"
		await userEvent.type(input, 'o');
		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent('foo');
		await expect.element(input).toHaveValue('foo');
	});

	it('updates the formData when an update intent is dispatched', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);
		const screen = render(
			<ConformForm select={selector} updateValue={{ example: 'foobar' }}>
				<input name="example" aria-label="Example" />
			</ConformForm>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');
		const updateButton = screen.getByRole('button', {
			name: 'Update',
		});

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');
		await expect.element(input).toHaveValue('');

		// Update the form
		await userEvent.click(updateButton);
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(input).toHaveValue('foobar');
		await expect.element(result).toHaveTextContent('foobar');
	});

	it('updates the formData when a reset intent is dispatched', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) => formData?.get('example') ?? '',
		);
		const screen = render(
			<ConformForm select={selector} defaultValue={{ example: 'foobar' }}>
				<input name="example" aria-label="Example" />
			</ConformForm>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Example');
		const resetButton = screen.getByRole('button', {
			name: 'Reset',
		});

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('');
		await expect.element(input).toHaveValue('');

		// Reset the form
		await userEvent.click(resetButton);
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(input).toHaveValue('foobar');
		await expect.element(result).toHaveTextContent('foobar');
	});

	it('allows selecting files only if options.acceptFiles is true', async () => {
		const selector = vi.fn(
			(formData: FormData | URLSearchParams) =>
				formData?.get('file') ?? 'no file input',
		);
		const screen = render(
			<Form select={selector} acceptFiles>
				<input type="file" name="file" aria-label="File" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('File');

		// FIXME: Why does it rendered three times?
		// 1. Initial render, 2. useFormData syncs the formData, 3. ???
		await expect.element(renderCount).toHaveTextContent(3);
		await expect.element(result).toHaveTextContent('<empty file>');

		const file = new File(['content'], 'example.txt', { type: 'text/plain' });
		await userEvent.upload(input, file);

		await expect.element(renderCount).toHaveTextContent(4);
		await expect.element(result).toHaveTextContent(file.name);

		screen.rerender(
			<Form select={selector} acceptFiles={false}>
				<input type="file" name="file" aria-label="File" />
			</Form>,
		);

		await expect.element(renderCount).toHaveTextContent(6);
		// It no longer returns a file object but the string representation
		// Should this throw an error instead?
		await expect.element(result).toHaveTextContent('[object File]');
	});

	it('re-renders only if the derived value changes', async () => {
		const selector = vi.fn((formData: FormData | URLSearchParams) =>
			formData.get('email')?.toString().includes('@') ? 'valid' : 'invalid',
		);
		const screen = render(
			<Form select={selector}>
				<input name="email" aria-label="Email" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Email');

		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('invalid');

		await userEvent.type(input, 'test');
		await expect.element(renderCount).toHaveTextContent(1);
		await expect.element(result).toHaveTextContent('invalid');

		await userEvent.type(input, '@');
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('valid');

		await userEvent.type(input, 'example.com');
		await expect.element(renderCount).toHaveTextContent(2);
		await expect.element(result).toHaveTextContent('valid');
	});
});
