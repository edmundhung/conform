/// <reference types="@vitest/browser/matchers" />
import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
import {
	type FormValue,
	type FormError,
	type FormOptions,
	useForm,
} from '../future';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';

describe('future export: useForm', () => {
	type Schema = {
		title: string;
		description: string;
		tasks: Array<{ content: string; completed: boolean }>;
	};

	function validateForm(value: Record<string, FormValue>) {
		const error: FormError<string> = {
			formErrors: [],
			fieldErrors: {},
		};

		if (!value.title) {
			error.fieldErrors.title = ['Title is required'];
		}

		if (!value.description) {
			error.fieldErrors.description = ['Description is required'];
		}

		if (!Array.isArray(value.tasks)) {
			error.fieldErrors.tasks = ['Tasks are required'];
		} else {
			for (let i = 0; i < value.tasks.length; i++) {
				const task = value.tasks[i];

				if (task === null || typeof task !== 'object' || !('content' in task)) {
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
		const { form, fields, intent } = useForm({
			defaultValue: {
				tasks: [{ content: 'Default Task', completed: false }],
			},
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
						fields.description.invalid ? fields.description.errorId : undefined
					}
				/>
				<div id={fields.description.errorId}>
					{fields.description.errors?.join(', ') ?? 'n/a'}
				</div>
				{fields.tasks.getFieldList().map((task, index) => {
					const taskField = task.getFieldset();

					return (
						<div key={task.key}>
							<input
								name={taskField.content.name}
								defaultValue={taskField.content.defaultValue}
								aria-label={`Task #${index + 1} Content`}
								aria-describedby={
									taskField.content.invalid
										? taskField.content.errorId
										: undefined
								}
							/>
							<div id={taskField.content.errorId}>
								{taskField.content.errors?.join(', ') ?? 'n/a'}
							</div>
							<input
								type="checkbox"
								name={taskField.completed.name}
								defaultChecked={taskField.completed.defaultChecked}
								aria-label={`Task #${index + 1} Completed`}
								aria-describedby={
									taskField.completed.invalid
										? taskField.completed.errorId
										: undefined
								}
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
				<button>Submit</button>
				<button type="button" onClick={() => intent.reset()}>
					Reset
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
			</form>
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
			updateFormButton: screen.getByRole('button', {
				name: 'Update Form',
			}),
			insertUrgentTaskButton: screen.getByRole('button', {
				name: 'Insert Urgent Task',
			}),
			insertTaskButton: screen.getByRole('button', {
				name: 'Insert Task',
			}),
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

		await expectNoErrorMessages(form.title, form.description);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectNoErrorMessages(form.title, form.description);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.title, form.description);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description);

		await userEvent.click(form.submitButton);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with input events
		await userEvent.type(form.title, 'example');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with blur event again
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		await userEvent.click(form.submitButton);
		await expectNoErrorMessages(form.title, form.description);
	});

	test('shouldValidate: onBlur', async () => {
		const screen = render(<Form shouldValidate="onBlur" />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectNoErrorMessages(form.title, form.description);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectNoErrorMessages(form.description);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.description);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test input events
		await userEvent.type(form.title, 'example');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with input events
		await userEvent.type(form.title, 'example');
		await expectErrorMessage(form.title, 'Title is required');
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with blur event again
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title, form.description);
	});

	test('shouldValidate: onInput', async () => {
		const screen = render(<Form shouldValidate="onInput" />);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectErrorMessage(form.title, 'Title is required');
		await expectNoErrorMessages(form.description);

		// Test revlidate with input events
		await userEvent.type(form.title, 'example');
		await expectNoErrorMessages(form.title, form.description);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		// Test revlidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectNoErrorMessages(form.title, form.description);
	});

	test('shouldValidate: onBlur / shouldRevalidate: onInput', async () => {
		const screen = render(
			<Form shouldValidate="onBlur" shouldRevalidate="onInput" />,
		);
		const form = getForm(screen);

		await expectNoErrorMessages(form.title, form.description);

		// Test input events
		await userEvent.type(form.title, 'example');
		await userEvent.clear(form.title);
		await expectNoErrorMessages(form.title, form.description);

		// Test blur event
		await userEvent.click(document.body);
		await expectErrorMessage(form.title, 'Title is required');
		await expectNoErrorMessages(form.description);

		// Test revalidate with input events
		await userEvent.type(form.title, 'example');
		await expectNoErrorMessages(form.title, form.description);

		// Test input events again
		await userEvent.type(form.description, 'hello world');
		await userEvent.clear(form.description);
		await expectNoErrorMessages(form.title, form.description);

		// Test blur event
		await userEvent.click(document.body);
		await expectNoErrorMessages(form.title);
		await expectErrorMessage(form.description, 'Description is required');

		// Test revalidate with input events again
		await userEvent.type(form.description, 'hello world');
		await expectNoErrorMessages(form.title, form.description);
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

		await userEvent.click(form.updateFormButton);
		await expect.element(form.title).toHaveValue('Foo');
		await expect.element(form.description).toHaveValue('Bar');
		await expect.element(task1.content).toHaveValue('Baz');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('Qux');
		await expect.element(task2.completed).not.toBeChecked();
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
		await userEvent.click(task1.completed);
		await userEvent.click(form.insertUrgentTaskButton);
		await expect.element(task1.content).toHaveValue('Urgent Task');
		await expect.element(task1.completed).toBeChecked();
		await expect.element(task2.content).toHaveValue('');
		await expect.element(task2.completed).not.toBeChecked();
		await expect.element(task3.content).toHaveValue('Old Task');
		await expect.element(task3.completed).not.toBeChecked();
		await expectErrorMessage(task2.content, 'Task content is required');
		await expectNoErrorMessages(task1.content, task3.content);

		await userEvent.click(task2.moveToTopButton);
		await expect.element(task1.content).toHaveValue('');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Urgent Task');
		await expect.element(task2.completed).toBeChecked();
		await expect.element(task3.content).toHaveValue('Old Task');
		await expect.element(task3.completed).not.toBeChecked();
		await expectErrorMessage(task1.content, 'Task content is required');
		await expectNoErrorMessages(task2.content, task3.content);

		await userEvent.click(task2.removeButton);
		await expect.element(task1.content).toHaveValue('');
		await expect.element(task1.completed).not.toBeChecked();
		await expect.element(task2.content).toHaveValue('Old Task');
		await expect.element(task2.completed).not.toBeChecked();
		await expect.element(task3.content).not.toBeInTheDocument();
		await expect.element(task3.completed).not.toBeInTheDocument();
		await expectErrorMessage(task1.content, 'Task content is required');
		await expectNoErrorMessages(task2.content);
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
