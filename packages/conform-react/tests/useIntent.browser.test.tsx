/// <reference types="@vitest/browser/matchers" />
import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
import { type FormOptions, useForm, useIntent } from '../future';
import { useRef } from 'react';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';

describe('future export: useIntent', () => {
	type Schema = {
		title: string;
		description: string;
	};

	function ValidateButton(props: {
		form?: string;
		field?: string;
		children: React.ReactNode;
	}) {
		const buttonRef = useRef<HTMLButtonElement>(null);
		const intent = useIntent(buttonRef);

		return (
			<button
				type="button"
				ref={buttonRef}
				onClick={() => intent.validate(props.field)}
				form={props.form}
			>
				{props.children}
			</button>
		);
	}

	function ResetButton(props: { form?: string; children: React.ReactNode }) {
		const buttonRef = useRef<HTMLButtonElement>(null);
		const intent = useIntent(buttonRef);

		return (
			<button
				type="button"
				ref={buttonRef}
				onClick={() => intent.reset()}
				form={props.form}
			>
				{props.children}
			</button>
		);
	}

	function Form(props: Partial<FormOptions<Schema, string, Schema>>) {
		const { form, fields } = useForm({
			onValidate({ payload, error }) {
				if (!payload.title) {
					error.fieldErrors.title = ['Title is required'];
				}

				if (!payload.description) {
					error.fieldErrors.description = ['Description is required'];
				}

				return error;
			},
			onSubmit(event) {
				event.preventDefault();
			},
			...props,
		});

		return (
			<div>
				<form {...form.props}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={
							fields.title.invalid ? fields.title.errorId : undefined
						}
					/>
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<textarea
						name={fields.description.name}
						defaultValue={fields.description.defaultValue}
						aria-label="Description"
						aria-describedby={
							fields.description.invalid
								? fields.description.errorId
								: undefined
						}
					/>
					<div id={fields.description.errorId}>
						{fields.description.errors?.join(', ') ?? 'n/a'}
					</div>
					<button>Submit</button>
					<ValidateButton>Validate Form</ValidateButton>
					<ValidateButton field={fields.description.name}>
						Validate Description
					</ValidateButton>
				</form>
				<ResetButton form={form.id}>Reset</ResetButton>
			</div>
		);
	}

	function getForm(screen: ReturnType<typeof render>) {
		return {
			title: screen.getByLabelText('Title'),
			description: screen.getByLabelText('Description'),
			submitButton: screen.getByRole('button', { name: 'Submit' }),
			resetButton: screen.getByRole('button', { name: 'Reset' }),
			validateFormButton: screen.getByRole('button', {
				name: 'Validate Form',
			}),
			validateDescriptionButton: screen.getByRole('button', {
				name: 'Validate Description',
			}),
			updateDescriptionButton: screen.getByRole('button', {
				name: 'Update Description',
			}),
		};
	}

	test('intent button with and without payload', async () => {
		const screen = render(<Form />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);

		await userEvent.click(form.validateDescriptionButton);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		await userEvent.click(form.validateFormButton);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
	});

	test('intent button associated through the form attribute', async () => {
		const screen = render(<Form />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);

		// Test reset form error
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		await userEvent.click(form.resetButton);
		await expectNoErrorMessages(form.title, form.description);

		// Test reset form value
		await userEvent.type(form.title, 'example');
		await userEvent.type(form.description, 'hello world');
		await userEvent.click(form.resetButton);
		await expect.element(form.title).toHaveValue('');
		await expect.element(form.description).toHaveValue('');

		// Test reset form with default values
		screen.rerender(
			<Form
				defaultValue={{
					title: 'example',
					description: 'hello world',
				}}
			/>,
		);

		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('hello world');

		await userEvent.type(form.title, 'New example');
		await userEvent.type(form.description, 'Foo bar baz');
		await userEvent.click(form.resetButton);
		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('hello world');
	});
});
