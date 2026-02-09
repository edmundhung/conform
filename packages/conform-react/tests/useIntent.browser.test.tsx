/// <reference types="@vitest/browser/matchers" />
import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import {
	type FormOptions,
	useForm as useFormDefault,
	useIntent as useIntentDefault,
	configureForms,
} from '../future';
import { useRef } from 'react';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';

const configured = configureForms();

const testCases: Array<{
	name: string;
	useForm: typeof useFormDefault;
	useIntent: typeof useIntentDefault;
}> = [
	{
		name: 'default',
		useForm: useFormDefault,
		useIntent: useIntentDefault,
	},
	{
		name: 'configureForms',
		useForm: configured.useForm,
		useIntent: configured.useIntent,
	},
];

describe.each(testCases)(
	'future export: useIntent - $name',
	({ useForm, useIntent }) => {
		type Schema = {
			title: string;
			description: string;
			tags: string[];
			newTag: string;
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
			const { form, fields, intent } = useForm({
				onValidate({ payload, error }) {
					if (!payload.title) {
						error.fieldErrors.title = ['Title is required'];
					}

					if (!payload.description) {
						error.fieldErrors.description = ['Description is required'];
					}

					if (Array.isArray(payload.tags)) {
						if (payload.tags.length > 2) {
							error.fieldErrors.tags = ['Maximum 2 tags allowed'];
						} else if (payload.tags.length < 1) {
							error.fieldErrors.tags = ['At least 1 tag required'];
						}
						for (let i = 0; i < payload.tags.length; i++) {
							const tag = payload.tags[i];
							if (typeof tag !== 'string' || tag.trim() === '') {
								error.fieldErrors[`tags[${i}]`] = ['Tag is required'];
							}
						}
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
						<div id={form.errorId} data-testid="form-error">
							{form.errors}
						</div>
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
						<input
							name={fields.newTag.name}
							defaultValue={fields.newTag.defaultValue}
							aria-label="New Tag"
						/>
						<div data-testid="newTag-error">
							{fields.newTag.errors?.join(', ') ?? 'n/a'}
						</div>
						<div data-testid="tags-count">
							{fields.tags.getFieldList().length}
						</div>
						<div data-testid="tags-error">
							{fields.tags.errors?.join(', ') ?? 'n/a'}
						</div>
						{fields.tags.getFieldList().map((tag, index) => (
							<div key={tag.key}>
								<input
									data-testid={`tag-${index}`}
									name={tag.name}
									defaultValue={tag.defaultValue}
								/>
								<button
									type="button"
									onClick={() =>
										intent.remove({
											name: fields.tags.name,
											index,
											onInvalid: 'revert',
										})
									}
								>
									Remove Tag {index + 1}
								</button>
								<button
									type="button"
									onClick={() =>
										intent.remove({
											name: fields.tags.name,
											index,
											onInvalid: 'insert',
											defaultValue: '',
										})
									}
								>
									Clear Tag {index + 1}
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={() =>
								intent.insert({
									name: fields.tags.name,
									from: fields.newTag.name,
								})
							}
						>
							Insert Tag from Input
						</button>
						<button
							type="button"
							onClick={() =>
								intent.insert({
									name: fields.tags.name,
									from: fields.newTag.name,
									onInvalid: 'revert',
								})
							}
						>
							Insert Tag with Revert
						</button>
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
				newTag: screen.getByLabelText('New Tag'),
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
				insertTagFromInputButton: screen.getByRole('button', {
					name: 'Insert Tag from Input',
				}),
				insertTagWithRevertButton: screen.getByRole('button', {
					name: 'Insert Tag with Revert',
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
					key="rerender-with-default-value"
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

		test('array intents', async () => {
			const screen = render(<Form defaultValue={{ tags: ['tag1'] }} />);
			const form = getForm(screen);
			const tagsCount = screen.getByTestId('tags-count');
			const tagsError = screen.getByTestId('tags-error');
			const newTagError = screen.getByTestId('newTag-error');

			await expect.element(tagsCount).toHaveTextContent('1');

			// Insert with from - invalid value (error on staging field)
			await userEvent.type(form.newTag, '   ');
			await userEvent.click(form.insertTagFromInputButton);
			await expect.element(newTagError).toHaveTextContent('Tag is required');
			await expect.element(tagsCount).toHaveTextContent('1');

			// Insert with from - valid value (succeeds, clears staging)
			await userEvent.clear(form.newTag);
			await userEvent.type(form.newTag, 'tag2');
			await userEvent.click(form.insertTagFromInputButton);
			await expect.element(form.newTag).toHaveValue('');
			await expect.element(tagsCount).toHaveTextContent('2');

			// Insert with from + revertIfInvalid - valid but exceeds max (error on array, not staging)
			await userEvent.type(form.newTag, 'tag3');
			await userEvent.click(form.insertTagWithRevertButton);
			await expect
				.element(tagsError)
				.toHaveTextContent('Maximum 2 tags allowed');
			await expect.element(newTagError).toHaveTextContent('n/a');
			await expect.element(tagsCount).toHaveTextContent('2');
			await expect.element(form.newTag).toHaveValue('tag3');

			// Remove with revertIfInvalid - succeeds down to min
			await userEvent.click(
				screen.getByRole('button', { name: 'Remove Tag 1' }),
			);
			await expect.element(tagsCount).toHaveTextContent('1');

			// Remove with ifInvalid: 'revert' - would go below min (reverted, error on array)
			await userEvent.click(
				screen.getByRole('button', { name: 'Remove Tag 1' }),
			);
			await expect
				.element(tagsError)
				.toHaveTextContent('At least 1 tag required');
			await expect.element(tagsCount).toHaveTextContent('1');
			// Value should be unchanged (reverted)
			await expect.element(screen.getByTestId('tag-0')).toHaveValue('tag2');

			// Remove with ifInvalid: 'insert' - would go below min (clears to blank instead)
			await userEvent.click(
				screen.getByRole('button', { name: 'Clear Tag 1' }),
			);
			await expect
				.element(tagsError)
				.toHaveTextContent('At least 1 tag required');
			await expect.element(tagsCount).toHaveTextContent('1');
			// Value should be cleared (new blank item inserted)
			await expect.element(screen.getByTestId('tag-0')).toHaveValue('');
		});

		test('array intents with sync validation and async onValidate', async () => {
			// Test that onInvalid works when onValidate returns [syncResult, asyncPromise]
			// The sync result provides array errors, async adds other checks
			const screen = render(
				<Form
					defaultValue={{ tags: ['tag1'] }}
					onValidate={({ payload }) => {
						// Sync validation for array constraints
						const syncError: {
							formErrors: string[];
							fieldErrors: Record<string, string[]>;
						} = {
							formErrors: [],
							fieldErrors: {},
						};

						if (Array.isArray(payload.tags)) {
							if (payload.tags.length > 2) {
								syncError.fieldErrors.tags = ['Maximum 2 tags allowed'];
							} else if (payload.tags.length < 1) {
								syncError.fieldErrors.tags = ['At least 1 tag required'];
							}
							for (let i = 0; i < payload.tags.length; i++) {
								const tag = payload.tags[i];
								if (typeof tag !== 'string' || tag.trim() === '') {
									syncError.fieldErrors[`tags[${i}]`] = ['Tag is required'];
								}
							}
						}

						// Async validation for other things (e.g., uniqueness check)
						const asyncResult = Promise.resolve({
							formErrors: ['Something went wrong'],
							fieldErrors: syncError.fieldErrors,
						});

						return [syncError, asyncResult];
					}}
				/>,
			);
			const formError = screen.getByTestId('form-error');
			const tagsCount = screen.getByTestId('tags-count');
			const tagsError = screen.getByTestId('tags-error');

			await expect.element(tagsCount).toHaveTextContent('1');

			await userEvent.click(
				screen.getByRole('button', { name: 'Remove Tag 1' }),
			);
			await expect.element(tagsCount).toHaveTextContent('1');
			await expect
				.element(tagsError)
				.toHaveTextContent('At least 1 tag required');
			await expect.element(screen.getByTestId('tag-0')).toHaveValue('tag1');

			// Wait for async validation to complete
			await expect.element(formError).toHaveTextContent('Something went wrong');

			// Check if the rest of the form state remains the same
			await expect.element(tagsCount).toHaveTextContent('1');
			await expect
				.element(tagsError)
				.toHaveTextContent('At least 1 tag required');
			await expect.element(screen.getByTestId('tag-0')).toHaveValue('tag1');
		});
	},
);
