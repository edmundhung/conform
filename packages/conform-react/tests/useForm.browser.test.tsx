/// <reference types="@vitest/browser/matchers" />
import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from 'vitest-browser-react';
import { Locator, userEvent } from '@vitest/browser/context';
import {
	type FormValue,
	type FormError,
	type FormOptions,
	useForm as useFormDefault,
	report,
	parseSubmission,
	configureForms,
} from '../future';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';
import { isGlobalInstance } from '@conform-to/dom';

type MockSchema<Shape = any> = {
	__brand: 'mockSchema';
	fields: Record<
		keyof Shape,
		{ required?: boolean; minLength?: number; accept?: string }
	>;
};

type MockFormShape = { title: string; description: string; avatar: File };

declare module '../future' {
	interface CustomSchemaTypes<Schema> {
		input: Schema extends MockSchema<infer Input> ? Input : never;
		output: Schema extends MockSchema<infer Output> ? Output : never;
		options: Schema extends MockSchema
			? {
					// Makes error messages uppercase
					uppercase?: boolean;
				}
			: never;
	}
}

const configured = configureForms();

const testCases: Array<{ name: string; useForm: typeof useFormDefault }> = [
	{ name: 'default', useForm: useFormDefault },
	{ name: 'configureForms', useForm: configured.useForm },
];

describe.each(testCases)('future export: $name', ({ useForm }) => {
	type Schema = {
		title: string;
		category?: string;
		description: string;
		tasks: Array<{ content: string; completed: boolean }>;
		confirmed: boolean;
	};

	function validateForm(value: Record<string, FormValue>) {
		const error: FormError<string> = {
			formErrors: [],
			fieldErrors: {},
		};

		if (!value.title) {
			error.fieldErrors.title = ['Title is required'];
		} else if (
			typeof value.title === 'string' &&
			value.title.startsWith('invalid')
		) {
			error.fieldErrors.title = ['Title is invalid'];
		}

		if (!value.description) {
			error.fieldErrors.description = ['Description is required'];
		} else if (
			typeof value.description === 'string' &&
			value.description.startsWith('invalid')
		) {
			error.fieldErrors.description = ['Description is invalid'];
		}

		if (!value.confirmed) {
			error.fieldErrors.confirmed = ['Confirmation is required'];
		}

		if (!Array.isArray(value.tasks)) {
			error.fieldErrors.tasks = ['Tasks are required'];
		} else {
			for (let i = 0; i < value.tasks.length; i++) {
				const task = value.tasks[i];

				if (
					task === null ||
					typeof task !== 'object' ||
					Array.isArray(task) ||
					isGlobalInstance(task, 'File')
				) {
					error.fieldErrors[`tasks[${i}]`] = ['Task is invalid'];
					continue;
				}
				if (!task.content) {
					error.fieldErrors[`tasks[${i}].content`] = [
						'Task content is required',
					];
				}
			}
		}

		return {
			error,
			value: value as unknown as Schema,
		};
	}

	function Form(props: Partial<FormOptions<Schema, string, Schema>>) {
		const { form, fields, intent } = useForm<Schema, string, Schema>({
			onValidate({ payload }) {
				return validateForm(payload);
			},
			onSubmit(event) {
				event.preventDefault();
			},
			...props,
		});

		return (
			<form {...form.props}>
				<input
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
					aria-label="Title"
					aria-describedby={fields.title.ariaDescribedBy}
				/>
				<div id={fields.title.errorId}>
					{fields.title.errors?.join(', ') ?? 'n/a'}
				</div>
				<textarea
					name={fields.description.name}
					defaultValue={fields.description.defaultValue}
					aria-label="Description"
					aria-describedby={fields.description.ariaDescribedBy}
				/>
				<div id={fields.description.errorId}>
					{fields.description.errors?.join(', ') ?? 'n/a'}
				</div>
				<select
					name={fields.category.name}
					defaultValue={fields.category.defaultValue}
					aria-label="Category"
					aria-describedby={fields.category.ariaDescribedBy}
				>
					<option value="">Select a category</option>
					<option value="personal">Personal</option>
					<option value="work">Work</option>
				</select>
				<div id={fields.category.errorId}>
					{fields.category.errors?.join(', ') ?? 'n/a'}
				</div>
				{fields.tasks.getFieldList().map((task, index) => {
					const taskField = task.getFieldset();

					return (
						<div key={task.key}>
							<input
								name={taskField.content.name}
								defaultValue={taskField.content.defaultValue}
								aria-label={`Task #${index + 1} Content`}
								aria-describedby={taskField.content.ariaDescribedBy}
							/>
							<div id={taskField.content.errorId}>
								{taskField.content.errors?.join(', ') ?? 'n/a'}
							</div>
							<input
								type="checkbox"
								name={taskField.completed.name}
								defaultChecked={taskField.completed.defaultChecked}
								aria-label={`Task #${index + 1} Completed`}
								aria-describedby={taskField.completed.ariaDescribedBy}
							/>
							<div id={taskField.completed.errorId}>
								{taskField.completed.errors?.join(', ') ?? 'n/a'}
							</div>
							<button
								type="button"
								onClick={() =>
									intent.remove({ name: fields.tasks.name, index })
								}
							>
								Remove Task #{index + 1}
							</button>
							<button
								type="button"
								onClick={() =>
									intent.reorder({
										name: fields.tasks.name,
										from: index,
										to: 0,
									})
								}
							>
								Move Task #{index + 1} to Top
							</button>
						</div>
					);
				})}
				<label>
					<input
						type="checkbox"
						name={fields.confirmed.name}
						defaultChecked={fields.confirmed.defaultChecked}
						aria-describedby={
							!fields.confirmed.valid ? fields.confirmed.errorId : undefined
						}
					/>
					Confirmed
				</label>
				<div id={fields.confirmed.errorId}>
					{fields.confirmed.errors?.join(', ') ?? 'n/a'}
				</div>
				<input
					type="hidden"
					name="controlled-hidden-input"
					value="controlled-value"
					aria-label="Controlled Hidden Input"
				/>
				<input
					type="hidden"
					name="uncontrolled-hidden-input"
					defaultValue="uncontrolled-value"
					aria-label="Uncontrolled Hidden Input"
				/>
				<button>Submit</button>
				<button type="button" onClick={() => intent.reset()}>
					Reset
				</button>
				<button
					type="button"
					onClick={() => intent.reset({ defaultValue: null })}
				>
					Clear
				</button>
				<button
					type="button"
					onClick={() =>
						intent.reset({
							defaultValue: {
								title: 'Reset Title',
								description: 'Reset Description',
								tasks: [
									{ content: 'Reset Task 1', completed: false },
									{ content: 'Reset Task 2', completed: true },
								],
								confirmed: true,
							},
						})
					}
				>
					Reset to Custom Value
				</button>
				<button type="button" onClick={() => intent.validate()}>
					Validate Form
				</button>
				<button type="button" onClick={() => intent.validate('description')}>
					Validate Description
				</button>
				<button
					type="button"
					onClick={() =>
						intent.update({ name: fields.description.name, value: '' })
					}
				>
					Update Description
				</button>
				<button
					type="button"
					onClick={() =>
						intent.update({
							value: {
								title: 'Foo',
								description: 'Bar',
								tasks: [
									{ content: 'Baz', completed: true },
									{ content: 'Qux', completed: false },
								],
							},
						})
					}
				>
					Update Form
				</button>
				<button
					type="button"
					onClick={() =>
						intent.insert({
							name: fields.tasks.name,
						})
					}
				>
					Insert Task
				</button>
				<button
					type="button"
					onClick={() =>
						intent.insert({
							name: fields.tasks.name,
							defaultValue: {
								content: 'Urgent Task',
								completed: true,
							},
							index: 0,
						})
					}
				>
					Insert Urgent Task
				</button>
				<button
					type="button"
					onClick={() => {
						intent.update({
							value: {
								title: 'Form Update Title',
								description: 'Form Update Description',
								tasks: [
									{ content: 'Form Task 1', completed: true },
									{ content: 'Form Task 2', completed: false },
								],
							},
						});
						intent.update({
							name: fields.description.name,
							value: 'Separate Description Update',
						});
						intent.update({
							name: fields.tasks.name,
							index: 0,
							value: { content: 'Separate Task Update', completed: true },
						});
					}}
				>
					Multiple Updates
				</button>
				<button
					type="button"
					onClick={() => {
						intent.reset();
						intent.validate();
					}}
				>
					Reset then Validate
				</button>
				<button
					type="button"
					onClick={() => {
						intent.insert({ name: fields.tasks.name, index: 0 });
						intent.remove({ name: fields.tasks.name, index: 1 });
						intent.reorder({ name: fields.tasks.name, from: 0, to: 1 });
					}}
				>
					Insert Remove Reorder
				</button>
			</form>
		);
	}

	function getForm(screen: ReturnType<typeof render>) {
		return {
			title: screen.getByLabelText('Title'),
			description: screen.getByLabelText('Description'),
			category: screen.getByLabelText('Category'),
			confirmed: screen.getByLabelText('Confirmed'),
			controlledHiddenInput: screen.getByLabelText('Controlled Hidden Input', {
				exact: true,
			}),
			uncontrolledHiddenInput: screen.getByLabelText(
				'Uncontrolled Hidden Input',
				{ exact: true },
			),
			submitButton: screen.getByRole('button', { name: 'Submit' }),
			resetButton: screen.getByRole('button', { name: 'Reset', exact: true }),
			clearButton: screen.getByRole('button', { name: 'Clear' }),
			resetToCustomValueButton: screen.getByRole('button', {
				name: 'Reset to Custom Value',
			}),
			validateFormButton: screen.getByRole('button', {
				name: 'Validate Form',
			}),
			validateDescriptionButton: screen.getByRole('button', {
				name: 'Validate Description',
			}),
			updateDescriptionButton: screen.getByRole('button', {
				name: 'Update Description',
			}),
			updateFormButton: screen.getByRole('button', {
				name: 'Update Form',
			}),
			insertUrgentTaskButton: screen.getByRole('button', {
				name: 'Insert Urgent Task',
			}),
			insertTaskButton: screen.getByRole('button', {
				name: 'Insert Task',
			}),
			multipleUpdatesButton: screen.getByRole('button', {
				name: 'Multiple Updates',
			}),
			resetThenValidateButton: screen.getByRole('button', {
				name: 'Reset then Validate',
			}),
			insertRemoveReorderButton: screen.getByRole('button', {
				name: 'Insert Remove Reorder',
			}),
			getFormData(submitterLocator?: Locator) {
				const formElement = screen.container.querySelector('form');
				const submitter = submitterLocator?.element();

				if (formElement && (!submitter || submitter instanceof HTMLElement)) {
					return new FormData(formElement, submitter);
				}

				throw new Error('Form element / Submitter element not found');
			},
		};
	}

	function getTaskFieldset(screen: ReturnType<typeof render>, order: number) {
		return {
			content: screen.getByLabelText(`Task #${order} Content`),
			completed: screen.getByLabelText(`Task #${order} Completed`),
			removeButton: screen.getByRole('button', {
				name: `Remove Task #${order}`,
			}),
			moveToTopButton: screen.getByRole('button', {
				name: `Move Task #${order} to Top`,
			}),
		};
	}

	test('shouldValidate: onSubmit (default)', async () => {
		const screen = render(<Form />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		await userEvent.click(form.confirmed);
		await userEvent.click(form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with input events
		await userEvent.type(form.title, 'example');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with blur event again
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		await userEvent.click(form.confirmed);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		await userEvent.click(form.submitButton);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);
	});

	test('shouldValidate: onBlur', async () => {
		const screen = render(<Form shouldValidate="onBlur" />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectNoErrorMessages(form.description, form.confirmed);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectNoErrorMessages(form.confirmed);

		// Test input events
		await userEvent.click(form.confirmed);
		await userEvent.click(form.confirmed);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectNoErrorMessages(form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test input events
		await userEvent.type(form.title, 'example');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with blur event again
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description);
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with input events again
		await userEvent.click(form.confirmed);
		await expectNoErrorMessages(form.title, form.description);
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with blur event again
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);
	});

	test('shouldValidate: onInput', async () => {
		const screen = render(<Form shouldValidate="onInput" />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectErrorMessage(form.title, 'Title is required');
		await expectNoErrorMessages(form.description, form.confirmed);

		// Test revlidate with input events
		await userEvent.type(form.title, 'example');
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.title, form.confirmed);
		await expectErrorMessage(form.description, 'Description is required');

		// Test revlidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events
		await userEvent.click(form.confirmed);
		await userEvent.click(form.confirmed);
		await expectNoErrorMessages(form.title, form.description);
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with input events
		await userEvent.click(form.confirmed);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);
	});

	test('shouldValidate: onBlur / shouldRevalidate: onInput', async () => {
		const screen = render(
			<Form shouldValidate="onBlur" shouldRevalidate="onInput" />,
		);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectNoErrorMessages(form.description, form.confirmed);

		// Test revalidate with input events
		await userEvent.type(form.title, 'example');
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test input events
		await userEvent.click(form.confirmed);
		await userEvent.click(form.confirmed);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description);
		await expectErrorMessage(form.confirmed, 'Confirmation is required');

		// Test revalidate with input events
		await userEvent.click(form.confirmed);
		await expectNoErrorMessages(form.title, form.description, form.confirmed);
	});

	test('validate intent', async () => {
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

	test('reset intent', async () => {
		const screen = render(<Form />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);
		await expect
			.element(form.controlledHiddenInput)
			.toHaveValue('controlled-value');
		await expect
			.element(form.uncontrolledHiddenInput)
			.toHaveValue('uncontrolled-value');

		// Test reset form error
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');
		await userEvent.click(form.resetButton);
		await expectNoErrorMessages(form.title, form.description);

		// Test submit after reset should work
		await userEvent.type(form.title, 'example');
		await userEvent.type(form.description, 'hello world');
		await userEvent.click(form.submitButton);
		await expectNoErrorMessages(form.title, form.description);

		await userEvent.click(form.resetButton);
		await expect.element(form.title).toHaveValue('');
		await expect.element(form.description).toHaveValue('');
		await expectNoErrorMessages(form.title, form.description);
		await expect
			.element(form.controlledHiddenInput)
			.toHaveValue('controlled-value');
		await expect
			.element(form.uncontrolledHiddenInput)
			.toHaveValue('uncontrolled-value');

		// Test reset form with default values
		screen.rerender(
			<Form
				defaultValue={{
					title: 'example',
					description: 'hello world',
					// We will test resetting tasks with the list intents
					tasks: [
						{ content: 'First Task', completed: false },
						{ content: 'Second Task', completed: true },
					],
				}}
			/>,
		);

		const task1 = getTaskFieldset(screen, 1);
		const task2 = getTaskFieldset(screen, 2);

		// Check that form is not reset yet when defaultValue changes
		await expect.element(form.title).toHaveValue('');
		await expect.element(form.description).toHaveValue('');

		// Reset to new default values
		await userEvent.click(form.resetButton);
		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('hello world');
		await expect.element(task1.content).toHaveValue('First Task');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Second Task');
		await expect.element(task2.completed).toBeChecked();

		await userEvent.type(form.title, 'New example');
		await userEvent.type(form.description, 'Foo bar baz');
		await userEvent.type(task1.content, 'Task 1');
		await userEvent.click(task1.completed);
		await userEvent.click(task2.removeButton);

		await userEvent.click(form.resetButton);
		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('hello world');
		await expect.element(task1.content).toHaveValue('First Task');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Second Task');
		await expect.element(task2.completed).toBeChecked();
		await expectNoErrorMessages(
			form.title,
			form.description,
			task1.content,
			task1.completed,
			task2.content,
			task2.completed,
		);

		// Test submit after reset should work
		await userEvent.click(form.submitButton);
		await expectNoErrorMessages(
			form.title,
			form.description,
			task1.content,
			task1.completed,
			task2.content,
			task2.completed,
		);
		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('hello world');
		await expect.element(task1.content).toHaveValue('First Task');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Second Task');
		await expect.element(task2.completed).toBeChecked();

		await userEvent.click(form.clearButton);
		await expect.element(form.title).toHaveValue('');
		await expect.element(form.description).toHaveValue('');
		await expect.element(task1.content).not.toBeInTheDocument();
		await expect.element(task1.completed).not.toBeInTheDocument();
		await expect.element(task2.content).not.toBeInTheDocument();
		await expect.element(task2.completed).not.toBeInTheDocument();

		// Verify unmanaged inputs are not affected by clear
		await expect
			.element(form.controlledHiddenInput)
			.toHaveValue('controlled-value');
		await expect
			.element(form.uncontrolledHiddenInput)
			.toHaveValue('uncontrolled-value');

		// Test reset to custom value
		await userEvent.click(form.resetToCustomValueButton);

		await expect.element(form.title).toHaveValue('Reset Title');
		await expect.element(form.description).toHaveValue('Reset Description');
		await expect.element(task1.content).toHaveValue('Reset Task 1');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Reset Task 2');
		await expect.element(task2.completed).toBeChecked();
		await expect.element(form.confirmed).toBeChecked();
		await expectNoErrorMessages(
			form.title,
			form.description,
			task1.content,
			task1.completed,
			task2.content,
			task2.completed,
		);

		// Verify unmanaged inputs are not affected by custom reset
		await expect
			.element(form.controlledHiddenInput)
			.toHaveValue('controlled-value');
		await expect
			.element(form.uncontrolledHiddenInput)
			.toHaveValue('uncontrolled-value');
	});

	test('update intent', async () => {
		const screen = render(
			<Form
				defaultValue={{
					title: 'example',
					description: 'hello world',
					// We will test resetting tasks with the list intents
					tasks: [{ content: 'Default Task', completed: false }],
				}}
			/>,
		);
		const form = getForm(screen);
		const task1 = getTaskFieldset(screen, 1);
		const task2 = getTaskFieldset(screen, 2);

		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('hello world');
		await expect.element(task1.content).toHaveValue('Default Task');
		await expect.element(task1.completed).not.toBeChecked();

		await userEvent.click(form.updateDescriptionButton);
		await expect.element(form.title).toHaveValue('example');
		await expect.element(form.description).toHaveValue('');
		await expect.element(task1.content).toHaveValue('Default Task');
		await expect.element(task1.completed).not.toBeChecked();

		// Verify unmanaged inputs are not affected by update
		await expect
			.element(form.controlledHiddenInput)
			.toHaveValue('controlled-value');
		await expect
			.element(form.uncontrolledHiddenInput)
			.toHaveValue('uncontrolled-value');

		await userEvent.click(form.updateFormButton);
		await expect.element(form.title).toHaveValue('Foo');
		await expect.element(form.description).toHaveValue('Bar');
		await expect.element(task1.content).toHaveValue('Baz');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('Qux');
		await expect.element(task2.completed).not.toBeChecked();

		// Verify unmanaged inputs are not affected by update with full form value
		await expect
			.element(form.controlledHiddenInput)
			.toHaveValue('controlled-value');
		await expect
			.element(form.uncontrolledHiddenInput)
			.toHaveValue('uncontrolled-value');
	});

	test('insert / reorder / remove intents', async () => {
		const screen = render(
			<Form
				defaultValue={{
					title: 'example',
					description: 'hello world',
					// We will test resetting tasks with the list intents
					tasks: [{ content: 'Default Task', completed: false }],
				}}
			/>,
		);
		const form = getForm(screen);
		const task1 = getTaskFieldset(screen, 1);
		const task2 = getTaskFieldset(screen, 2);
		const task3 = getTaskFieldset(screen, 3);

		await expect.element(task1.content).toHaveValue('Default Task');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).not.toBeInTheDocument();
		await expect.element(task2.completed).not.toBeInTheDocument();
		await expect.element(task3.content).not.toBeInTheDocument();
		await expect.element(task3.completed).not.toBeInTheDocument();

		await userEvent.clear(task1.content);
		await userEvent.click(task1.completed);
		await userEvent.click(form.submitButton);
		await expectErrorMessage(task1.content, 'Task content is required');

		await userEvent.click(form.insertTaskButton);
		await expect.element(task1.content).toHaveValue('');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('');
		await expect.element(task2.completed).not.toBeChecked();
		await expect.element(task3.content).not.toBeInTheDocument();
		await expect.element(task3.completed).not.toBeInTheDocument();
		await expectErrorMessage(task1.content, 'Task content is required');
		await expectNoErrorMessages(task2.content);

		await userEvent.type(task2.content, 'Old Task');
		await userEvent.click(form.insertUrgentTaskButton);
		await expect.element(task1.content).toHaveValue('Urgent Task');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('');
		await expect.element(task2.completed).toBeChecked();
		await expect.element(task3.content).toHaveValue('Old Task');
		await expect.element(task3.completed).not.toBeChecked();
		await expectErrorMessage(task2.content, 'Task content is required');
		await expectNoErrorMessages(task1.content, task3.content);

		await userEvent.click(task2.moveToTopButton);
		await expect.element(task1.content).toHaveValue('');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('Urgent Task');
		await expect.element(task2.completed).toBeChecked();
		await expect.element(task3.content).toHaveValue('Old Task');
		await expect.element(task3.completed).not.toBeChecked();
		await expectErrorMessage(task1.content, 'Task content is required');
		await expectNoErrorMessages(task2.content, task3.content);

		await userEvent.click(task2.removeButton);
		await expect.element(task1.content).toHaveValue('');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('Old Task');
		await expect.element(task2.completed).not.toBeChecked();
		await expect.element(task3.content).not.toBeInTheDocument();
		await expect.element(task3.completed).not.toBeInTheDocument();
		await expectErrorMessage(task1.content, 'Task content is required');
		await expectNoErrorMessages(task2.content);
	});

	test('server report', async () => {
		const screen = render(<Form />);
		const form = getForm(screen);
		const task1 = getTaskFieldset(screen, 1);
		const task2 = getTaskFieldset(screen, 2);

		await userEvent.type(form.title, 'invalid title');
		await userEvent.type(form.description, 'invalid description');
		await userEvent.click(form.confirmed);
		await userEvent.click(form.insertTaskButton);

		await expect.element(task1.content).toBeInTheDocument();
		await expect.element(task1.completed).toBeInTheDocument();

		// Trigger validation errors (values are present but invalid)
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is invalid');
		await expectErrorMessage(form.description, 'Description is invalid');
		await expectErrorMessage(task1.content, 'Task content is required');

		// Verify form has invalid values with errors
		await expect.element(form.title).toHaveValue('invalid title');
		await expect.element(form.description).toHaveValue('invalid description');

		// Test 1: Basic reset (should clear to empty values AND ignore server errors)
		screen.rerender(
			<Form
				lastResult={report(parseSubmission(form.getFormData()), {
					reset: true,
					error: {
						fieldErrors: {
							title: ['Server error for title'],
							description: ['Server error for description'],
						},
					},
				})}
			/>,
		);

		// Values should be cleared to empty
		await expect.element(form.title).toHaveValue('');
		await expect.element(form.description).toHaveValue('');
		await expect.element(form.confirmed).not.toBeChecked();
		// Tasks should be completely removed
		await expect.element(task1.content).not.toBeInTheDocument();
		await expect.element(task1.completed).not.toBeInTheDocument();
		// Server errors should be ignored (proves reset happened, not just form update)
		await expectNoErrorMessages(form.title, form.description);

		// Test 2: Reset with target value (should change invalid values to valid values AND clear errors)
		await userEvent.type(form.title, 'invalid old title');
		await userEvent.type(form.description, 'invalid old description');
		await userEvent.click(form.insertTaskButton);

		// Trigger validation errors (values present but invalid)
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is invalid');
		await expectErrorMessage(form.description, 'Description is invalid');

		// Verify form has invalid values with errors
		await expect.element(form.title).toHaveValue('invalid old title');
		await expect
			.element(form.description)
			.toHaveValue('invalid old description');

		screen.rerender(
			<Form
				lastResult={report(parseSubmission(form.getFormData()), {
					reset: true,
					value: {
						title: 'Updated Title',
						category: 'work',
						description: 'Updated Description',
						confirmed: 'on',
						tasks: [
							{ content: 'Task 1', completed: false },
							{ content: 'Task 2', completed: 'on' },
						],
					},
					error: {
						fieldErrors: {
							title: ['Server error that should be ignored'],
							description: ['Another server error'],
						},
					},
				})}
			/>,
		);

		// Values should change from "invalid old" to "Updated" (proves values changed)
		await expect.element(form.title).toHaveValue('Updated Title');
		await expect.element(form.category).toHaveValue('work');
		await expect.element(form.description).toHaveValue('Updated Description');
		await expect.element(form.confirmed).toBeChecked();
		await expect.element(task1.content).toHaveValue('Task 1');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Task 2');
		await expect.element(task2.completed).toBeChecked();
		// Server errors should be ignored (proves reset happened with target value)
		await expectNoErrorMessages(form.title, form.description);

		// Test 3: target value without reset (should update values and clear errors via value change)
		await userEvent.clear(form.title);
		await userEvent.type(form.title, 'invalid user title');

		// Trigger validation error (value present but invalid)
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is invalid');

		// Verify form has invalid title with error
		await expect.element(form.title).toHaveValue('invalid user title');
		await expect.element(form.description).toHaveValue('Updated Description');

		screen.rerender(
			<Form
				lastResult={report(parseSubmission(form.getFormData()), {
					value: {
						title: 'Server Processed Title',
						category: 'personal',
						description: 'Server Updated Description',
						tasks: [{ content: 'Server Task', completed: false }],
					},
				})}
			/>,
		);

		// Values should change from "invalid user" to "Server Processed" (proves values changed)
		await expect.element(form.title).toHaveValue('Server Processed Title');
		await expect.element(form.category).toHaveValue('personal');
		await expect
			.element(form.description)
			.toHaveValue('Server Updated Description');
		await expect.element(task1.content).toHaveValue('Server Task');
		await expect.element(task1.completed).not.toBeChecked();
		// Errors should be cleared because the form value changed (triggers revalidation, not reset)
		await expectNoErrorMessages(form.title);

		// Test 4: null target value without reset (breaking change - should clear without reset)
		screen.rerender(
			<Form
				lastResult={report(parseSubmission(form.getFormData()), {
					value: null,
				})}
			/>,
		);

		// Should clear form (null becomes {}) but NOT trigger a form reset
		await expect.element(form.title).toHaveValue('');
		await expect.element(form.description).toHaveValue('');
		await expect.element(form.confirmed).not.toBeChecked();
		// Tasks should be removed since target value is now {}
		await expect.element(task1.content).not.toBeInTheDocument();
		await expect.element(task1.completed).not.toBeInTheDocument();
	});

	test('server report with defaultValue', async () => {
		const defaultValue = {
			title: 'Initial Title',
			description: 'Initial Description',
			confirmed: 'on',
			tasks: [
				{ content: 'Initial Task 1', completed: false },
				{ content: 'Initial Task 2', completed: 'on' },
			],
		};
		const screen = render(<Form defaultValue={defaultValue} />);
		const form = getForm(screen);
		const task1 = getTaskFieldset(screen, 1);
		const task2 = getTaskFieldset(screen, 2);

		// Verify initial defaultValue is rendered
		await expect.element(form.title).toHaveValue('Initial Title');
		await expect.element(form.description).toHaveValue('Initial Description');
		await expect.element(form.confirmed).toBeChecked();
		await expect.element(task1.content).toHaveValue('Initial Task 1');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Initial Task 2');
		await expect.element(task2.completed).toBeChecked();

		// User modifies the form with invalid values
		await userEvent.clear(form.title);
		await userEvent.type(form.title, 'invalid modified title');
		await userEvent.clear(form.description);
		await userEvent.type(form.description, 'invalid modified description');
		await userEvent.click(form.confirmed);

		// Trigger validation errors (values present but invalid)
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is invalid');
		await expectErrorMessage(form.description, 'Description is invalid');

		// Verify form has invalid values with errors
		await expect.element(form.title).toHaveValue('invalid modified title');
		await expect
			.element(form.description)
			.toHaveValue('invalid modified description');

		// Test 1: Reset without target value should reset to defaultValue (and ignore server errors)
		screen.rerender(
			<Form
				defaultValue={defaultValue}
				lastResult={report(parseSubmission(form.getFormData()), {
					reset: true,
					error: {
						fieldErrors: {
							title: ['Server error for title'],
							description: ['Server error for description'],
						},
					},
				})}
			/>,
		);

		// Should reset back to defaultValue (proves values changed from "invalid modified" to "Initial")
		await expect.element(form.title).toHaveValue('Initial Title');
		await expect.element(form.description).toHaveValue('Initial Description');
		await expect.element(form.confirmed).toBeChecked();
		await expect.element(task1.content).toHaveValue('Initial Task 1');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Initial Task 2');
		await expect.element(task2.completed).toBeChecked();
		// Server errors should be ignored (proves reset happened)
		await expectNoErrorMessages(form.title, form.description);

		// User modifies the form again with invalid values
		await userEvent.clear(form.title);
		await userEvent.type(form.title, 'invalid another title');
		await userEvent.clear(form.description);
		await userEvent.type(form.description, 'invalid another description');

		// Trigger validation errors again
		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is invalid');
		await expectErrorMessage(form.description, 'Description is invalid');

		// Verify form has invalid values with errors
		await expect.element(form.title).toHaveValue('invalid another title');
		await expect
			.element(form.description)
			.toHaveValue('invalid another description');

		// Test 2: Reset with target value should reset to target value (not defaultValue, ignore server errors)
		screen.rerender(
			<Form
				defaultValue={defaultValue}
				lastResult={report(parseSubmission(form.getFormData()), {
					reset: true,
					value: {
						title: 'Server Updated Title',
						description: 'Server Updated Description',
						confirmed: false,
						tasks: [{ content: 'Server Task', completed: 'on' }],
					},
					error: {
						fieldErrors: {
							title: ['Server error should be ignored'],
							description: ['Another server error'],
						},
					},
				})}
			/>,
		);

		// Should reset to target value, NOT to defaultValue (proves values changed to server values, not default)
		await expect.element(form.title).toHaveValue('Server Updated Title');
		await expect
			.element(form.description)
			.toHaveValue('Server Updated Description');
		await expect.element(form.confirmed).not.toBeChecked();
		await expect.element(task1.content).toHaveValue('Server Task');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).not.toBeInTheDocument();
		await expect.element(task2.completed).not.toBeInTheDocument();
		// Server errors should be ignored (proves reset happened with target value, not just form update)
		await expectNoErrorMessages(form.title, form.description);
	});

	describe('batched intents', () => {
		test('multiple updates', async () => {
			const screen = render(<Form />);
			const form = getForm(screen);
			const task1 = getTaskFieldset(screen, 1);
			const task2 = getTaskFieldset(screen, 2);

			await userEvent.click(form.multipleUpdatesButton);

			await expect.element(form.title).toHaveValue('Form Update Title');
			await expect
				.element(form.description)
				.toHaveValue('Separate Description Update');
			await expect.element(task1.content).toHaveValue('Separate Task Update');
			await expect.element(task1.completed).toBeChecked();
			await expect.element(task2.content).toHaveValue('Form Task 2');
			await expect.element(task2.completed).not.toBeChecked();
		});

		test('reset then validate', async () => {
			const screen = render(<Form />);
			const form = getForm(screen);
			const task1 = getTaskFieldset(screen, 1);

			// Update the form to have different values
			await userEvent.type(form.title, 'Foo');
			await userEvent.type(form.description, 'Bar');
			await userEvent.click(form.insertTaskButton);
			await expect.element(task1.content).toBeInTheDocument();
			await expect.element(task1.completed).toBeInTheDocument();

			// Reset then validate
			await userEvent.click(form.resetThenValidateButton);

			await expect.element(form.title).toHaveValue('');
			await expect.element(form.description).toHaveValue('');
			await expect.element(task1.content).not.toBeInTheDocument();
			await expect.element(task1.completed).not.toBeInTheDocument();
			await expectErrorMessage(form.title, 'Title is required');
			await expectErrorMessage(form.description, 'Description is required');

			screen.rerender(
				<Form
					key="rerender-with-default-value"
					defaultValue={{
						title: 'Foo',
						description: '',
						tasks: [{ content: '', completed: true }],
					}}
				/>,
			);

			await userEvent.clear(form.title);
			await userEvent.type(form.description, 'Bar');
			await userEvent.type(task1.content, 'Task 1');

			// Reset then validate again
			await userEvent.click(form.resetThenValidateButton);

			await expectNoErrorMessages(form.title);
			await expectErrorMessage(form.description, 'Description is required');
		});

		test('insert and remove then reorder', async () => {
			const screen = render(
				<Form
					defaultValue={{
						tasks: [
							{ content: 'Task 1', completed: false },
							{ content: 'Task 2', completed: true },
						],
					}}
				/>,
			);
			const form = getForm(screen);
			const task1 = getTaskFieldset(screen, 1);
			const task2 = getTaskFieldset(screen, 2);
			const task3 = getTaskFieldset(screen, 3);

			await expect.element(task1.content).toHaveValue('Task 1');
			await expect.element(task2.content).toHaveValue('Task 2');

			// Insert, remove, and reorder in a single batch
			await userEvent.click(form.insertRemoveReorderButton);

			// After insert at 0, remove at 1, reorder 0 to 1:
			// Initial: ["Task 1", "Task 2"]
			// After insert at 0: ["", "Task 1", "Task 2"]
			// After remove at 1: ["", "Task 2"]
			// After reorder 0 to 1: ["Task 2", ""]
			await expect.element(task1.content).toHaveValue('Task 2');
			await expect.element(task2.content).toHaveValue('');
			await expect.element(task3.content).not.toBeInTheDocument();
		});
	});

	describe('async validation', () => {
		beforeAll(() => {
			vi.useFakeTimers();
		});

		afterAll(() => {
			vi.useRealTimers();
		});

		test('default behavior', async () => {
			const screen = render(
				<Form
					shouldRevalidate="onInput"
					onValidate={({ payload }) => {
						const result = validateForm(payload);

						// Validate whether title is unique only if it has no errors
						if (!result.error.fieldErrors.title) {
							return new Promise((resolve) => {
								// Move the timer forward each time so we can incrementally resolve the async validation
								vi.advanceTimersByTime(1);
								setTimeout(() => {
									if (result.value.title !== 'example') {
										result.error.fieldErrors.title = ['Title is already taken'];
									}

									resolve(result);
								}, 100);
							});
						}

						return result;
					}}
				/>,
			);

			const form = getForm(screen);

			await expectNoErrorMessages(form.title);

			await userEvent.click(form.submitButton);
			await expectErrorMessage(form.title, 'Title is required');

			await userEvent.type(form.title, 'exampl');
			// Still waiting for async validation to complete
			await expectErrorMessage(form.title, 'Title is required');

			for (let i = 0; i < 'exampl'.length; i++) {
				// This resolves the async validation, but the result is invalidated because of the next character typed
				vi.advanceTimersToNextTimer();
				await expectErrorMessage(form.title, 'Title is required');
			}

			// Now we type the last character, which should resolve the last async validation result
			await expectErrorMessage(form.title, 'Title is already taken');

			await userEvent.type(form.title, 'e');
			await expectErrorMessage(form.title, 'Title is already taken');

			vi.advanceTimersToNextTimer();
			await expectNoErrorMessages(form.title);
		});
	});
});

describe('configureForms customization', () => {
	type Schema = {
		title: string;
		description: string;
	};

	test('shouldValidate config is respected (shouldRevalidate defaults to shouldValidate)', async () => {
		const customized = configureForms({
			shouldValidate: 'onBlur',
			// shouldRevalidate not specified - should default to 'onBlur'
		});

		function Form() {
			const { form, fields } = customized.useForm<Schema, string>({
				onValidate({ payload, error }) {
					if (!payload.title) {
						error.fieldErrors.title = ['Title is required'];
					}
					return error;
				},
				onSubmit(event) {
					event.preventDefault();
				},
			});

			return (
				<form {...form.props}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={fields.title.ariaDescribedBy}
					/>
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<button>Submit</button>
				</form>
			);
		}

		const screen = render(<Form />);
		const title = screen.getByLabelText('Title');

		await expectNoErrorMessages(title);

		// Type and clear - no validation on input
		await userEvent.type(title, 'example');
		await userEvent.clear(title);
		await expectNoErrorMessages(title);

		// Blur should trigger validation (from global config)
		await userEvent.click(document.body);
		await expectErrorMessage(title, 'Title is required');

		// Revalidation should NOT happen on input (shouldRevalidate defaults to onBlur)
		await userEvent.type(title, 'example');
		await expectErrorMessage(title, 'Title is required');

		// Revalidation should happen on blur
		await userEvent.click(document.body);
		await expectNoErrorMessages(title);
	});

	test('shouldRevalidate config is respected', async () => {
		const customized = configureForms({
			shouldValidate: 'onBlur',
			shouldRevalidate: 'onInput',
		});

		function Form() {
			const { form, fields } = customized.useForm<Schema, string>({
				onValidate({ payload, error }) {
					if (!payload.title) {
						error.fieldErrors.title = ['Title is required'];
					}
					return error;
				},
				onSubmit(event) {
					event.preventDefault();
				},
			});

			return (
				<form {...form.props}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={fields.title.ariaDescribedBy}
					/>
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<button>Submit</button>
				</form>
			);
		}

		const screen = render(<Form />);
		const title = screen.getByLabelText('Title');

		// Trigger initial validation via blur
		await userEvent.type(title, 'example');
		await userEvent.clear(title);
		await userEvent.click(document.body);
		await expectErrorMessage(title, 'Title is required');

		// Revalidation should happen on input (from global config)
		await userEvent.type(title, 'example');
		await expectNoErrorMessages(title);
	});

	test('useForm options override configureForms config', async () => {
		const customized = configureForms({
			shouldValidate: 'onBlur',
			shouldRevalidate: 'onInput',
		});

		function Form() {
			const { form, fields } = customized.useForm<Schema, string>({
				shouldValidate: 'onSubmit',
				shouldRevalidate: 'onBlur',
				onValidate({ payload, error }) {
					if (!payload.title) {
						error.fieldErrors.title = ['Title is required'];
					}
					return error;
				},
				onSubmit(event) {
					event.preventDefault();
				},
			});

			return (
				<form {...form.props}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={fields.title.ariaDescribedBy}
					/>
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<button>Submit</button>
				</form>
			);
		}

		const screen = render(<Form />);
		const title = screen.getByLabelText('Title');
		const submitButton = screen.getByRole('button', { name: 'Submit' });

		await expectNoErrorMessages(title);

		// Validation should NOT happen on blur (config has onBlur, but override is onSubmit)
		await userEvent.type(title, 'example');
		await userEvent.clear(title);
		await userEvent.click(document.body);
		await expectNoErrorMessages(title);

		// Validation should happen on submit (overriding global onBlur)
		await userEvent.click(submitButton);
		await expectErrorMessage(title, 'Title is required');

		// Revalidation should NOT happen on input (config has onInput, but override is onBlur)
		await userEvent.type(title, 'example');
		await expectErrorMessage(title, 'Title is required');

		// Revalidation should happen on blur (overriding global onInput)
		await userEvent.click(document.body);
		await expectNoErrorMessages(title);
	});

	test('extendFieldMetadata adds custom properties', async () => {
		const customized = configureForms({
			extendFieldMetadata(metadata) {
				return {
					get inputProps() {
						return {
							name: metadata.name,
							defaultValue: metadata.defaultValue,
							'aria-invalid': !metadata.valid,
							'aria-describedby': metadata.ariaDescribedBy,
						};
					},
				};
			},
		});

		function Form() {
			const { form, fields } = customized.useForm<Schema, string>({
				onValidate({ payload, error }) {
					if (!payload.title) {
						error.fieldErrors.title = ['Title is required'];
					}
					return error;
				},
				onSubmit(event) {
					event.preventDefault();
				},
			});

			return (
				<form {...form.props}>
					<input {...fields.title.inputProps} aria-label="Title" />
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<button>Submit</button>
				</form>
			);
		}

		const screen = render(<Form />);
		const title = screen.getByLabelText('Title');
		const submitButton = screen.getByRole('button', { name: 'Submit' });

		// Initially valid
		await expect.element(title).not.toHaveAttribute('aria-invalid', 'true');

		// Submit to trigger error
		await userEvent.click(submitButton);
		await expectErrorMessage(title, 'Title is required');
		await expect.element(title).toHaveAttribute('aria-invalid', 'true');

		// Fix the error
		await userEvent.type(title, 'example');
		await userEvent.click(submitButton);
		await expectNoErrorMessages(title);
		await expect.element(title).not.toHaveAttribute('aria-invalid', 'true');
	});

	test('extendFormMetadata adds custom properties', async () => {
		const customized = configureForms({
			extendFormMetadata(metadata) {
				return {
					get formProps() {
						return {
							...metadata.props,
							'data-form-id': metadata.id,
							'data-valid': metadata.valid,
						};
					},
				};
			},
		});

		function Form() {
			const { form, fields } = customized.useForm<Schema, string>({
				id: 'test-form',
				onValidate({ payload, error }) {
					if (!payload.title) {
						error.fieldErrors.title = ['Title is required'];
					}
					return error;
				},
				onSubmit(event) {
					event.preventDefault();
				},
			});

			return (
				<form {...form.formProps}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={fields.title.ariaDescribedBy}
					/>
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<button>Submit</button>
				</form>
			);
		}

		const screen = render(<Form />);
		const formElement = screen.container.querySelector('form')!;
		const title = screen.getByLabelText('Title');
		const submitButton = screen.getByRole('button', { name: 'Submit' });

		// Check custom attributes
		expect(formElement.getAttribute('data-form-id')).toBe('test-form');
		expect(formElement.getAttribute('data-valid')).toBe('true');

		// Submit to trigger error
		await userEvent.click(submitButton);
		await expectErrorMessage(title, 'Title is required');
		expect(formElement.getAttribute('data-valid')).toBe('false');

		// Fix the error
		await userEvent.type(title, 'example');
		await userEvent.click(submitButton);
		await expectNoErrorMessages(title);
		expect(formElement.getAttribute('data-valid')).toBe('true');
	});

	test('schema integration', async () => {
		const mockSchema: MockSchema<MockFormShape> = {
			__brand: 'mockSchema',
			fields: {
				title: { required: true, minLength: 3 },
				description: { required: false },
				avatar: { accept: 'image/*' },
			},
		};

		const customized = configureForms<string, MockSchema>({
			isSchema(value): value is MockSchema {
				return (
					typeof value === 'object' &&
					value !== null &&
					'__brand' in value &&
					value.__brand === 'mockSchema'
				);
			},
			validateSchema(schema, payload, options) {
				const errors: Record<string, string[]> = {};
				const format = (msg: string) =>
					options?.uppercase ? msg.toUpperCase() : msg;

				for (const [field, rules] of Object.entries(schema.fields)) {
					const value = payload[field];
					const stringValue = typeof value === 'string' ? value : '';

					if (rules.required && (!stringValue || stringValue.trim() === '')) {
						errors[field] = [format(`${field} is required`)];
					} else if (rules.minLength && stringValue.length < rules.minLength) {
						errors[field] = [
							format(`${field} must be at least ${rules.minLength} characters`),
						];
					}
				}

				const hasErrors = Object.keys(errors).length > 0;
				return {
					error: hasErrors ? { formErrors: [], fieldErrors: errors } : null,
					value: hasErrors ? undefined : (payload as any),
				};
			},
			getConstraints(schema) {
				const constraints: Record<
					string,
					{ required?: boolean; minLength?: number; accept?: string }
				> = {};

				for (const [field, rules] of Object.entries(schema.fields)) {
					constraints[field] = {
						required: rules.required,
						minLength: rules.minLength,
						accept: rules.accept,
					};
				}

				return constraints;
			},
		});

		function Form({ uppercase }: { uppercase?: boolean }) {
			const { form, fields } = customized.useForm(mockSchema, {
				schemaOptions: { uppercase },
				onSubmit(event) {
					event.preventDefault();
				},
			});

			return (
				<form {...form.props}>
					<input
						name={fields.title.name}
						defaultValue={fields.title.defaultValue}
						aria-label="Title"
						aria-describedby={fields.title.ariaDescribedBy}
						required={fields.title.required}
						minLength={fields.title.minLength}
					/>
					<div id={fields.title.errorId}>
						{fields.title.errors?.join(', ') ?? 'n/a'}
					</div>
					<textarea
						name={fields.description.name}
						defaultValue={fields.description.defaultValue}
						aria-label="Description"
						aria-describedby={fields.description.ariaDescribedBy}
					/>
					<div id={fields.description.errorId}>
						{fields.description.errors?.join(', ') ?? 'n/a'}
					</div>
					<input
						type="file"
						name={fields.avatar.name}
						aria-label="Avatar"
						accept={fields.avatar.accept}
					/>
					<button>Submit</button>
				</form>
			);
		}

		const screen = render(<Form />);
		const title = screen.getByLabelText('Title');
		const description = screen.getByLabelText('Description');
		const submitButton = screen.getByRole('button', { name: 'Submit' });

		// Verify getConstraints worked - HTML attributes should be set
		await expect.element(title).toHaveAttribute('required');
		await expect.element(title).toHaveAttribute('minlength', '3');

		const avatar = screen.getByLabelText('Avatar');
		await expect.element(avatar).toHaveAttribute('accept', 'image/*');

		// Submit empty form - validateSchema should be called (without strict mode)
		await userEvent.click(submitButton);
		await expectErrorMessage(title, 'title is required');
		await expectNoErrorMessages(description);

		// Type valid value to clear error
		await userEvent.type(title, 'abc');
		await userEvent.click(submitButton);
		await expectNoErrorMessages(title, description);

		// Re-render with uppercase mode enabled
		screen.rerender(<Form uppercase />);
		await userEvent.clear(title);
		await userEvent.click(submitButton);

		// Error message should now be uppercase (proves schemaOptions is passed)
		await expectErrorMessage(title, 'TITLE IS REQUIRED');
	});
});
