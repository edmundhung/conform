/// <reference types="@vitest/browser/matchers" />
import { describe, test, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { configureForms, defineIntent } from '../future';
import { expectErrorMessage, expectNoErrorMessages } from './helpers';

type MockSchema<Shape = any> = {
	__brand: 'mockSchema';
	fields: Record<
		keyof Shape,
		{ required?: boolean; minLength?: number; accept?: string }
	>;
};

type MockFormShape = { title: string; description: string; avatar: File };

describe('configureForms', () => {
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
			const { form, fields } = customized.useForm<Schema, string[]>({
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
			const { form, fields } = customized.useForm<Schema, string[]>({
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
			const { form, fields } = customized.useForm<Schema, string[]>({
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
			const { form, fields } = customized.useForm<Schema, string[]>({
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
			const { form, fields } = customized.useForm<Schema, string[]>({
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

		const customized = configureForms<string[], MockSchema>({
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
					error: hasErrors ? { formErrors: null, fieldErrors: errors } : null,
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

	test.todo('custom intents handlers', async () => {
		const customized = configureForms({
			intents: {
				dismiss: defineIntent(),
			},
		});

		function Form() {
			const { form, intent } = customized.useForm({
				defaultValue: {
					title: '',
				},
				onValidate({ intent, error }) {
					if (intent.type === 'dismiss') {
						return null;
					}

					return error;
				},
			});

			return (
				<form {...form.props}>
					<button type="button" onClick={() => intent.dismiss()}>
						Dismiss
					</button>
				</form>
			);
		}

		const screen = render(<Form />);

		await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
	});
});
