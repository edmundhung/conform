import { describe, test } from 'vitest';
import { FormOptions, FormProvider, useField, useForm } from '../future';
import { render } from 'vitest-browser-react';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';
import { userEvent } from '@vitest/browser/context';

describe('future export: useField', () => {
	type Schema = {
		title: string;
		description: string;
	};

	function FieldError(props: { name: string; form?: string }) {
		const field = useField(props.name, {
			formId: props.form,
		});

		return (
			<div id={field.invalid ? field.errorId : undefined}>
				{field.errors?.join(', ') ?? 'n/a'}
			</div>
		);
	}

	function ExampleForm({
		children,
		...options
	}: Partial<FormOptions<Schema, string, Schema>> & {
		children?: React.ReactNode;
	}) {
		const { form, fields, intent } = useForm({
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
			...options,
		});

		return (
			<FormProvider context={form.context}>
				{children}
				<form {...form.props}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={
							fields.title.invalid ? fields.title.errorId : undefined
						}
					/>
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
					<button>Submit</button>
					<button type="button" onClick={() => intent.validate('description')}>
						Validate Description
					</button>
				</form>
			</FormProvider>
		);
	}

	function getForm(screen: ReturnType<typeof render>) {
		return {
			title: screen.getByLabelText('Title'),
			description: screen.getByLabelText('Description'),
			submitButton: screen.getByRole('button', { name: 'Submit' }),
			validateDescriptionButton: screen.getByRole('button', {
				name: 'Validate Description',
			}),
		};
	}

	test('extract field metadata from context', async () => {
		const screen = render(
			<ExampleForm id="test">
				<FieldError name="title" />
				<FieldError name="description" form="test" />
			</ExampleForm>,
		);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);

		await userEvent.click(form.validateDescriptionButton);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
	});
});
