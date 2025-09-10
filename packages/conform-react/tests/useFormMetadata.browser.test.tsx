import { describe, test } from 'vitest';
import { FormOptions, FormProvider, useForm, useFormMetadata } from '../future';
import { render } from 'vitest-browser-react';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';
import { userEvent } from '@vitest/browser/context';

describe('future export: useFormMetadata', () => {
	type Schema = {
		title: string;
		description: string;
	};

	function FormErrors() {
		const form = useFormMetadata();

		return (
			<div>
				{Object.entries(form.fieldErrors).map(([name, errors]) => {
					const field = form.getField(name);

					return (
						<div key={name} id={!field.valid ? field.errorId : undefined}>
							{errors?.join(', ') ?? 'n/a'}
						</div>
					);
				})}
			</div>
		);
	}

	function Form({
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

	test('extract form metadata from context', async () => {
		const screen = render(
			<Form>
				<FormErrors />
			</Form>,
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
