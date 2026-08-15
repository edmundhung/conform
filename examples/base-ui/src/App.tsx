import { coerceFormValue } from '@conform-to/zod/v4/future';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
	CheckboxField,
	CheckboxGroupField,
	ComboboxField,
	NumberFieldControl,
	RadioGroupField,
	SelectField,
	SliderField,
	SwitchField,
	TextareaField,
	TextInputField,
} from './components';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		fullName: z
			.string({ error: 'Enter at least 2 characters' })
			.min(2, 'Enter at least 2 characters'),
		bio: z
			.string({ error: 'Enter at least 10 characters' })
			.min(10, 'Enter at least 10 characters'),
		acceptTerms: z
			.boolean()
			.refine((value) => value, 'Accept the terms to continue'),
		interests: z
			.enum(['design', 'engineering', 'research'])
			.array()
			.min(1, 'Choose at least one interest'),
		plan: z.enum(['starter', 'professional', 'enterprise'], {
			error: 'Choose a plan',
		}),
		country: z.enum(['gb', 'ca', 'jp'], { error: 'Choose a country' }),
		framework: z.enum(['react', 'vue', 'svelte'], {
			error: 'Choose a framework',
		}),
		quantity: z
			.number()
			.min(1, 'Use at least 1')
			.max(10, 'Use no more than 10'),
		budget: z
			.number()
			.min(0, 'Budget cannot be negative')
			.max(100, 'Budget cannot exceed 100'),
		notifications: z.boolean(),
	}),
);

const interestOptions = [
	{ value: 'design', label: 'Design' },
	{ value: 'engineering', label: 'Engineering' },
	{ value: 'research', label: 'Research' },
];

const planOptions = [
	{ value: 'starter', label: 'Starter' },
	{ value: 'professional', label: 'Professional' },
	{ value: 'enterprise', label: 'Enterprise' },
];

const countryOptions = [
	{ value: 'gb', label: 'United Kingdom' },
	{ value: 'ca', label: 'Canada' },
	{ value: 'jp', label: 'Japan' },
];

const frameworkOptions = [
	{ value: 'react', label: 'React' },
	{ value: 'vue', label: 'Vue' },
	{ value: 'svelte', label: 'Svelte' },
];

export default function App() {
	const formRef = useRef<HTMLFormElement>(null);
	const [resetKey, setResetKey] = useState(0);
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(() => {
		const searchParams = new URLSearchParams(window.location.search);

		if (!searchParams.has('quantity')) {
			searchParams.set('quantity', '1');
		}

		if (!searchParams.has('budget')) {
			searchParams.set('budget', '50');
		}

		return searchParams;
	});
	const { form, fields, intent } = useForm(schema, {
		defaultValue: searchParams,
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			const url = new URL(document.URL);
			const searchParams = new URLSearchParams();
			formData.forEach((entry, name) => {
				if (typeof entry === 'string') {
					searchParams.append(name, entry);
				}
			});
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);
			setSearchParams(searchParams);
			setSubmittedValue(value);
		},
	});
	const remountFields = useCallback(() => {
		setResetKey((key) => key + 1);
	}, []);

	useEffect(() => {
		const formElement = formRef.current;
		if (!formElement) {
			return;
		}

		formElement.addEventListener('reset', remountFields);
		return () => formElement.removeEventListener('reset', remountFields);
	}, [remountFields]);

	return (
		<main>
			<form
				{...form.props}
				ref={formRef}
				className="form-card"
				onChange={() => setSubmittedValue(null)}
			>
				<header>
					<p className="eyebrow">Conform × Base UI</p>
					<h1>Base UI Example</h1>
					<p className="intro">
						Direct Base UI primitives with Conform owning validation and form
						state.
					</p>
				</header>

				<div className="field-list" key={`${searchParams}:${resetKey}`}>
					<TextInputField
						label="Full name"
						description="A native Base UI Input."
						{...fields.fullName.textInputProps}
						// Equivalent to:
						// id={fields.fullName.id}
						// name={fields.fullName.name}
						// defaultValue={fields.fullName.defaultValue}
						// invalid={!fields.fullName.valid}
						// errors={fields.fullName.errors}
					/>

					<TextareaField
						label="Bio"
						description="Field.Control renders a native textarea."
						{...fields.bio.textareaProps}
						// Equivalent to:
						// id={fields.bio.id}
						// name={fields.bio.name}
						// defaultValue={fields.bio.defaultValue}
						// invalid={!fields.bio.valid}
						// errors={fields.bio.errors}
					/>

					<CheckboxField
						label="Accept terms"
						description="The Base UI checkbox owns a hidden native checkbox."
						{...fields.acceptTerms.checkboxProps}
						// Equivalent to:
						// id={fields.acceptTerms.id}
						// name={fields.acceptTerms.name}
						// defaultChecked={fields.acceptTerms.defaultChecked}
						// invalid={!fields.acceptTerms.valid}
						// errors={fields.acceptTerms.errors}
					/>

					<CheckboxGroupField
						label="Interests"
						description="Each checked item contributes the same name to FormData."
						items={interestOptions}
						{...fields.interests.checkboxGroupProps}
						// Equivalent to:
						// id={fields.interests.id}
						// name={fields.interests.name}
						// defaultValue={fields.interests.defaultOptions}
						// invalid={!fields.interests.valid}
						// errors={fields.interests.errors}
					/>

					<RadioGroupField
						label="Plan"
						description="The group serializes one scalar value."
						items={planOptions}
						{...fields.plan.radioGroupProps}
						// Equivalent to:
						// id={fields.plan.id}
						// name={fields.plan.name}
						// defaultValue={fields.plan.defaultValue}
						// invalid={!fields.plan.valid}
						// errors={fields.plan.errors}
					/>

					<SelectField
						label="Country"
						description="Select maintains a form-compatible hidden input."
						placeholder="Choose a country"
						items={countryOptions}
						{...fields.country.selectProps}
						// Equivalent to:
						// id={fields.country.id}
						// name={fields.country.name}
						// defaultValue={fields.country.defaultValue}
						// invalid={!fields.country.valid}
						// errors={fields.country.errors}
					/>

					<ComboboxField
						label="Framework"
						description="Filtering is transient; the selected value is submitted."
						placeholder="Search frameworks"
						items={frameworkOptions}
						{...fields.framework.comboboxProps}
						// Equivalent to:
						// id={fields.framework.id}
						// name={fields.framework.name}
						// defaultValue={fields.framework.defaultValue}
						// invalid={!fields.framework.valid}
						// errors={fields.framework.errors}
					/>

					<NumberFieldControl
						label="Quantity"
						description="Use the buttons or arrow keys; Zod receives a coerced number."
						{...fields.quantity.numberFieldProps}
						// Equivalent to:
						// id={fields.quantity.id}
						// name={fields.quantity.name}
						// defaultValue={fields.quantity.defaultValue}
						// invalid={!fields.quantity.valid}
						// errors={fields.quantity.errors}
					/>

					<SliderField
						label="Budget"
						description="A controlled Base UI slider synchronized through useControl."
						{...fields.budget.sliderProps}
						// Equivalent to:
						// id={fields.budget.id}
						// name={fields.budget.name}
						// defaultValue={fields.budget.defaultValue}
						// invalid={!fields.budget.valid}
						// errors={fields.budget.errors}
					/>

					<SwitchField
						label="Product notifications"
						description="The hidden checkbox submits “on” only while enabled."
						{...fields.notifications.switchProps}
						// Equivalent to:
						// id={fields.notifications.id}
						// name={fields.notifications.name}
						// defaultChecked={fields.notifications.defaultChecked}
						// invalid={!fields.notifications.valid}
						// errors={fields.notifications.errors}
					/>
				</div>

				{submittedValue ? (
					<section className="submitted" aria-live="polite">
						<h2>Parsed submission</h2>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</section>
				) : null}

				<footer>
					<button
						className="button secondary"
						type="button"
						onClick={() => intent.reset()}
					>
						Reset
					</button>
					<button className="button primary" type="submit">
						Submit
					</button>
				</footer>
			</form>
		</main>
	);
}
