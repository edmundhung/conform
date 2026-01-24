/// <reference types="@vitest/browser/matchers" />
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { Locator, userEvent } from '@vitest/browser/context';
import { PersistBoundary, useFormData } from '../future';
import { useState, useRef } from 'react';

describe('PersistBoundary', () => {
	function getElement<C>(locator: Locator, ctor: new () => C): C {
		const element = locator.query();

		if (element instanceof ctor) {
			return element;
		}

		expect.fail(`Element should be an instance of ${ctor.name}`);
	}

	function Form(props: {
		id?: string;
		children: React.ReactNode;
		onSubmit?: (formData: FormData) => void;
	}) {
		return (
			<form
				id={props.id}
				onSubmit={(event) => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					props.onSubmit?.(formData);
				}}
			>
				{props.children}
				<button type="submit">Submit</button>
				<button type="reset">Reset</button>
			</form>
		);
	}

	it('renders children within a div', async () => {
		const screen = render(
			<Form>
				<PersistBoundary name="test">
					<input name="field" aria-label="Field" />
				</PersistBoundary>
			</Form>,
		);

		const input = screen.getByLabelText('Field');
		await expect.element(input).toBeVisible();
	});

	it('persists input value when unmounted and restores when remounted', async () => {
		function TestComponent() {
			const [show, setShow] = useState(true);
			const [submittedValue, setSubmittedValue] = useState<string | null>(null);

			return (
				<Form
					onSubmit={(formData) =>
						setSubmittedValue(formData.get('field') as string)
					}
				>
					{show && (
						<PersistBoundary name="field-boundary">
							<input name="field" aria-label="Field" defaultValue="" />
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="submitted">{submittedValue ?? '<none>'}</pre>
				</Form>
			);
		}

		const screen = render(<TestComponent />);

		const input = screen.getByLabelText('Field');
		const toggleButton = screen.getByText('Toggle');
		const submitButton = screen.getByText('Submit');
		const submitted = screen.getByTestId('submitted');

		// Type a value
		await userEvent.fill(input, 'test value');
		await expect.element(input).toHaveValue('test value');

		// Hide the boundary (unmount)
		await userEvent.click(toggleButton);

		// Submit the form - value should be persisted
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent('test value');

		// Show the boundary again (remount)
		await userEvent.click(toggleButton);

		// The input should have the persisted value restored
		const restoredInput = screen.getByLabelText('Field');
		await expect.element(restoredInput).toHaveValue('test value');

		// Submit again - should still have the value
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent('test value');
	});

	it('resets persisted values to defaultValue on form reset', async () => {
		function TestComponent() {
			const [show, setShow] = useState(true);
			const [submittedValue, setSubmittedValue] = useState<string | null>(null);

			return (
				<Form
					onSubmit={(formData) =>
						setSubmittedValue(formData.get('field') as string)
					}
				>
					{show && (
						<PersistBoundary name="field-boundary">
							<input name="field" aria-label="Field" defaultValue="default" />
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="submitted">{submittedValue ?? '<none>'}</pre>
				</Form>
			);
		}

		const screen = render(<TestComponent />);

		const input = screen.getByLabelText('Field');
		const toggleButton = screen.getByText('Toggle');
		const submitButton = screen.getByText('Submit');
		const resetButton = screen.getByText('Reset');
		const submitted = screen.getByTestId('submitted');

		// Change the value
		await userEvent.fill(input, 'changed value');
		await expect.element(input).toHaveValue('changed value');

		// Hide the boundary (persists the value)
		await userEvent.click(toggleButton);

		// Reset the form (should reset persisted values to defaultValue)
		await userEvent.click(resetButton);

		// Submit - should get the defaultValue since persisted inputs were reset
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent('default');
	});

	it('does not duplicate values when remounting', async () => {
		function TestComponent() {
			const [show, setShow] = useState(true);
			const [submittedValues, setSubmittedValues] = useState<string[]>([]);

			return (
				<Form
					onSubmit={(formData) =>
						setSubmittedValues(formData.getAll('field') as string[])
					}
				>
					{show && (
						<PersistBoundary name="field-boundary">
							<input name="field" aria-label="Field" />
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="submitted">{JSON.stringify(submittedValues)}</pre>
				</Form>
			);
		}

		const screen = render(<TestComponent />);

		const input = screen.getByLabelText('Field');
		const toggleButton = screen.getByText('Toggle');
		const submitButton = screen.getByText('Submit');
		const submitted = screen.getByTestId('submitted');

		// Fill the field
		await userEvent.fill(input, 'test');

		// Toggle off then on (unmount then remount)
		await userEvent.click(toggleButton);
		await userEvent.click(toggleButton);

		// Submit - should only have one value, not duplicated
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent('["test"]');
	});

	it('persists and restores all field types (input, select, textarea, checkbox, radio)', async () => {
		function TestComponent() {
			const [show, setShow] = useState(true);
			const [submittedData, setSubmittedData] = useState<Record<
				string,
				string | string[] | null
			> | null>(null);

			return (
				<Form
					onSubmit={(formData) =>
						setSubmittedData({
							name: formData.get('name') as string,
							country: formData.get('country') as string,
							bio: formData.get('bio') as string,
							newsletter: formData.get('newsletter') as string | null,
							plan: formData.get('plan') as string | null,
							features: formData.getAll('features') as string[],
						})
					}
				>
					{show && (
						<PersistBoundary name="all-fields">
							<label>
								Name
								<input name="name" aria-label="Name" defaultValue="" />
							</label>
							<label>
								Country
								<select name="country" aria-label="Country" defaultValue="">
									<option value="">Select...</option>
									<option value="us">United States</option>
									<option value="uk">United Kingdom</option>
									<option value="ca">Canada</option>
								</select>
							</label>
							<label>
								Bio
								<textarea name="bio" aria-label="Bio" defaultValue="" />
							</label>
							<label>
								<input
									type="checkbox"
									name="newsletter"
									value="yes"
									aria-label="Newsletter"
								/>
								Subscribe to newsletter
							</label>
							<fieldset>
								<legend>Plan</legend>
								<label>
									<input
										type="radio"
										name="plan"
										value="free"
										aria-label="Free"
									/>
									Free
								</label>
								<label>
									<input
										type="radio"
										name="plan"
										value="pro"
										aria-label="Pro"
									/>
									Pro
								</label>
							</fieldset>
							<fieldset>
								<legend>Features</legend>
								<label>
									<input
										type="checkbox"
										name="features"
										value="dark-mode"
										aria-label="Dark Mode"
									/>
									Dark Mode
								</label>
								<label>
									<input
										type="checkbox"
										name="features"
										value="notifications"
										aria-label="Notifications"
									/>
									Notifications
								</label>
							</fieldset>
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="submitted">
						{submittedData ? JSON.stringify(submittedData) : '<none>'}
					</pre>
				</Form>
			);
		}

		const screen = render(<TestComponent />);

		const toggleButton = screen.getByText('Toggle');
		const submitButton = screen.getByText('Submit');
		const submitted = screen.getByTestId('submitted');

		// Fill text input
		await userEvent.fill(screen.getByLabelText('Name'), 'John Doe');

		// Select option
		await userEvent.selectOptions(
			getElement(screen.getByLabelText('Country'), HTMLSelectElement),
			'uk',
		);

		// Fill textarea
		await userEvent.fill(screen.getByLabelText('Bio'), 'Hello world');

		// Check checkbox
		await userEvent.click(screen.getByLabelText('Newsletter'));

		// Select radio
		await userEvent.click(screen.getByLabelText('Pro'));

		// Check multiple checkboxes
		await userEvent.click(screen.getByLabelText('Dark Mode'));
		await userEvent.click(screen.getByLabelText('Notifications'));

		// Hide the boundary (unmount)
		await userEvent.click(toggleButton);

		// Submit the form - all values should be persisted
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent(
			JSON.stringify({
				name: 'John Doe',
				country: 'uk',
				bio: 'Hello world',
				newsletter: 'yes',
				plan: 'pro',
				features: ['dark-mode', 'notifications'],
			}),
		);

		// Show the boundary again (remount)
		await userEvent.click(toggleButton);

		// All fields should have their persisted values restored
		await expect.element(screen.getByLabelText('Name')).toHaveValue('John Doe');
		await expect.element(screen.getByLabelText('Country')).toHaveValue('uk');
		await expect
			.element(screen.getByLabelText('Bio'))
			.toHaveValue('Hello world');
		await expect.element(screen.getByLabelText('Newsletter')).toBeChecked();
		await expect.element(screen.getByLabelText('Pro')).toBeChecked();
		await expect.element(screen.getByLabelText('Free')).not.toBeChecked();
		await expect.element(screen.getByLabelText('Dark Mode')).toBeChecked();
		await expect.element(screen.getByLabelText('Notifications')).toBeChecked();
	});

	it('works with inputs associated via form attribute', async () => {
		function TestComponent() {
			const [show, setShow] = useState(true);
			const [submittedValue, setSubmittedValue] = useState<string | null>(null);

			return (
				<>
					<form
						id="my-form"
						onSubmit={(event) => {
							event.preventDefault();
							const formData = new FormData(event.currentTarget);
							setSubmittedValue(formData.get('field') as string);
						}}
					>
						<button type="submit">Submit</button>
					</form>
					{/* PersistBoundary outside the form, inputs linked via form attribute */}
					{show && (
						<PersistBoundary name="external-field">
							<input
								name="field"
								form="my-form"
								aria-label="Field"
								defaultValue=""
							/>
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="submitted">{submittedValue ?? '<none>'}</pre>
				</>
			);
		}

		const screen = render(<TestComponent />);

		const input = screen.getByLabelText('Field');
		const toggleButton = screen.getByText('Toggle');
		const submitButton = screen.getByText('Submit');
		const submitted = screen.getByTestId('submitted');

		// Type a value
		await userEvent.fill(input, 'test value');
		await expect.element(input).toHaveValue('test value');

		// Hide the boundary (unmount)
		await userEvent.click(toggleButton);

		// Submit the form - value should be persisted
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent('test value');

		// Show the boundary again (remount)
		await userEvent.click(toggleButton);

		// The input should have the persisted value restored
		const restoredInput = screen.getByLabelText('Field');
		await expect.element(restoredInput).toHaveValue('test value');
	});

	it('persists and restores file input', async () => {
		function TestComponent() {
			const [show, setShow] = useState(true);
			const [submittedFiles, setSubmittedFiles] = useState<string[]>([]);

			return (
				<Form
					onSubmit={(formData) => {
						const files = formData.getAll('file') as File[];
						setSubmittedFiles(files.map((f) => f.name));
					}}
				>
					{show && (
						<PersistBoundary name="file-boundary">
							<input type="file" name="file" aria-label="File" multiple />
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="submitted">{JSON.stringify(submittedFiles)}</pre>
				</Form>
			);
		}

		const screen = render(<TestComponent />);

		let fileInput = getElement(screen.getByLabelText('File'), HTMLInputElement);
		const toggleButton = screen.getByText('Toggle');
		const submitButton = screen.getByText('Submit');
		const submitted = screen.getByTestId('submitted');

		// Set files on the input
		const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
		const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file1);
		dataTransfer.items.add(file2);
		fileInput.files = dataTransfer.files;
		expect(fileInput.files?.length).toBe(2);

		// Toggle off and on - files should be persisted and restored
		await userEvent.click(toggleButton);
		await userEvent.click(toggleButton);

		fileInput = getElement(screen.getByLabelText('File'), HTMLInputElement);
		expect(fileInput.files?.length).toBe(2);
		expect(fileInput.files?.[0]?.name).toBe('test1.txt');
		expect(fileInput.files?.[1]?.name).toBe('test2.txt');

		await userEvent.click(submitButton);
		await expect
			.element(submitted)
			.toHaveTextContent('["test1.txt","test2.txt"]');

		// Clear the file input
		fileInput.files = new DataTransfer().files;
		expect(fileInput.files?.length).toBe(0);

		// Toggle off and on - cleared state should be preserved
		await userEvent.click(toggleButton);
		await userEvent.click(toggleButton);

		fileInput = getElement(screen.getByLabelText('File'), HTMLInputElement);
		expect(fileInput.files?.length).toBe(0);

		// Submit - should have no files (FormData includes empty file entry with name "")
		await userEvent.click(submitButton);
		await expect.element(submitted).toHaveTextContent('[""]');
	});

	it('uses name to isolate persisted inputs between boundaries', async () => {
		function TestComponent() {
			const [step, setStep] = useState(1);
			const [submittedData, setSubmittedData] = useState<
				Record<string, string>
			>({});

			return (
				<Form
					onSubmit={(formData) => {
						const data: Record<string, string> = {};
						formData.forEach((value, key) => {
							if (typeof value === 'string') {
								data[key] = value;
							}
						});
						setSubmittedData(data);
					}}
				>
					{step === 1 ? (
						<PersistBoundary name="step-1">
							<input name="name" aria-label="Name" defaultValue="" />
						</PersistBoundary>
					) : (
						<PersistBoundary name="step-2">
							<input name="address" aria-label="Address" defaultValue="" />
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setStep(step === 1 ? 2 : 1)}>
						Toggle Step
					</button>
					<pre data-testid="submitted">{JSON.stringify(submittedData)}</pre>
				</Form>
			);
		}

		const screen = render(<TestComponent />);

		const toggleStepButton = screen.getByText('Toggle Step');
		const submitButton = screen.getByText('Submit');
		const submitted = screen.getByTestId('submitted');

		// Fill step 1
		await userEvent.fill(screen.getByLabelText('Name'), 'John');

		// Go to step 2 (step 1 values persisted with name="step-1")
		await userEvent.click(toggleStepButton);

		// Fill step 2
		await userEvent.fill(screen.getByLabelText('Address'), '123 Main St');

		// Submit - both values should be present (step 1 persisted, step 2 visible)
		await userEvent.click(submitButton);
		expect(JSON.parse(submitted.element().textContent ?? '{}')).toEqual({
			name: 'John',
			address: '123 Main St',
		});

		// Go back to step 1 (step 2 values persisted with name="step-2")
		await userEvent.click(toggleStepButton);

		// Step 1 value should be restored
		await expect.element(screen.getByLabelText('Name')).toHaveValue('John');

		// Submit - both values should still be present
		await userEvent.click(submitButton);
		expect(JSON.parse(submitted.element().textContent ?? '{}')).toEqual({
			name: 'John',
			address: '123 Main St',
		});
	});

	it('integrates with useFormData without duplicates or flashing', async () => {
		// Track all values seen by useFormData to verify no intermediate/incorrect states.
		// This works because PersistBoundary uses useLayoutEffect, ensuring cleanup
		// happens BEFORE useFormData reads the form state.
		const valuesHistory: string[][] = [];

		function TestComponent() {
			const [show, setShow] = useState(true);
			const formRef = useRef<HTMLFormElement>(null);

			const fieldValues = useFormData(
				formRef,
				(formData) => {
					const values = formData.getAll('field') as string[];
					valuesHistory.push([...values]);
					return values;
				},
				{ fallback: [] as string[] },
			);

			return (
				<form ref={formRef}>
					{show && (
						<PersistBoundary name="field-boundary">
							<input name="field" aria-label="Field" defaultValue="" />
						</PersistBoundary>
					)}
					<button type="button" onClick={() => setShow(!show)}>
						Toggle
					</button>
					<pre data-testid="values">{JSON.stringify(fieldValues)}</pre>
				</form>
			);
		}

		const screen = render(<TestComponent />);

		const input = screen.getByLabelText('Field');
		const toggleButton = screen.getByText('Toggle');
		const values = screen.getByTestId('values');

		// Fill the field
		valuesHistory.length = 0;
		await userEvent.fill(input, 'test');
		await expect.element(values).toHaveTextContent('["test"]');

		// Unmount → remount → unmount → remount
		valuesHistory.length = 0;
		await userEvent.click(toggleButton);
		await expect.element(values).toHaveTextContent('["test"]');
		await userEvent.click(toggleButton);
		await expect.element(values).toHaveTextContent('["test"]');
		await userEvent.click(toggleButton);
		await userEvent.click(toggleButton);
		await expect.element(values).toHaveTextContent('["test"]');

		// Verify no intermediate states: no duplicates, no wrong values
		for (const seen of valuesHistory) {
			expect(seen.length).toBeLessThanOrEqual(1);
			if (seen.length === 1) {
				expect(seen[0]).toBe('test');
			}
		}
	});
});
