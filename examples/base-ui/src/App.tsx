import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { Radio } from '@base-ui/react/radio';
import { coerceFormValue } from '@conform-to/zod/v4/future';
import { useState } from 'react';
import { z } from 'zod';
import {
	CheckboxControl,
	CheckboxGroupControl,
	ComboboxControl,
	NumberFieldControl,
	RadioGroupControl,
	SelectControl,
	SliderControl,
	SwitchControl,
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
		acceptTerms: z.literal(true, {
			error: 'Accept the terms to continue',
		}),
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
			.min(2, 'Use at least 2')
			.max(10, 'Use no more than 10'),
		budget: z
			.number()
			.min(10, 'Use a budget of at least 10')
			.max(100, 'Budget cannot exceed 100'),
		notifications: z.literal(true, {
			error: 'Enable product notifications',
		}),
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

	return (
		<main>
			<form
				{...form.props}
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

				<div className="field-list">
					<Field.Root className="field" invalid={!fields.fullName.valid}>
						<Field.Label className="label">Full name</Field.Label>
						<Input
							className="text-control"
							{...fields.fullName.inputProps}
							// Equivalent to:
							// name={fields.fullName.name}
							// defaultValue={fields.fullName.defaultValue}
						/>
						<Field.Description className="description">
							A native Base UI Input.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.fullName.errors?.length ? 'alert' : undefined}
						>
							{fields.fullName.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.bio.valid}>
						<Field.Label className="label">Bio</Field.Label>
						<Field.Control
							render={<textarea rows={4} />}
							className="text-control"
							{...fields.bio.textareaProps}
							// Equivalent to:
							// name={fields.bio.name}
							// defaultValue={fields.bio.defaultValue}
						/>
						<Field.Description className="description">
							Field.Control renders a native textarea.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.bio.errors?.length ? 'alert' : undefined}
						>
							{fields.bio.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.acceptTerms.valid}>
						<Field.Label className="choice-label">
							<CheckboxControl
								{...fields.acceptTerms.checkboxProps}
								// Equivalent to:
								// name={fields.acceptTerms.name}
								// defaultChecked={fields.acceptTerms.defaultChecked}
							/>
							Accept terms
						</Field.Label>
						<Field.Description className="description">
							The visible checkbox is synchronized with a BaseControl.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.acceptTerms.errors?.length ? 'alert' : undefined}
						>
							{fields.acceptTerms.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.interests.valid}>
						<Field.Label
							className="label"
							nativeLabel={false}
							render={<span />}
						>
							Interests
						</Field.Label>
						<CheckboxGroupControl
							{...fields.interests.checkboxGroupProps}
							// Equivalent to:
							// name={fields.interests.name}
							// defaultValue={fields.interests.defaultOptions}
						>
							{interestOptions.map((item) => (
								<Field.Item className="choice-label" key={item.value}>
									<Checkbox.Root className="checkbox" value={item.value}>
										<Checkbox.Indicator className="checkbox-indicator">
											✓
										</Checkbox.Indicator>
									</Checkbox.Root>
									<Field.Label>{item.label}</Field.Label>
								</Field.Item>
							))}
						</CheckboxGroupControl>
						<Field.Description className="description">
							A multiple BaseControl serializes the selected values.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.interests.errors?.length ? 'alert' : undefined}
						>
							{fields.interests.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.plan.valid}>
						<Field.Label
							className="label"
							nativeLabel={false}
							render={<span />}
						>
							Plan
						</Field.Label>
						<RadioGroupControl
							{...fields.plan.radioGroupProps}
							// Equivalent to:
							// name={fields.plan.name}
							// defaultValue={fields.plan.defaultValue}
						>
							{planOptions.map((item) => (
								<Field.Item className="choice-label" key={item.value}>
									<Radio.Root className="radio" value={item.value}>
										<Radio.Indicator className="radio-indicator" />
									</Radio.Root>
									<Field.Label>{item.label}</Field.Label>
								</Field.Item>
							))}
						</RadioGroupControl>
						<Field.Description className="description">
							The BaseControl serializes one scalar value.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.plan.errors?.length ? 'alert' : undefined}
						>
							{fields.plan.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.country.valid}>
						<Field.Label className="label">Country</Field.Label>
						<SelectControl
							placeholder="Choose a country"
							items={countryOptions}
							{...fields.country.selectProps}
							// Equivalent to:
							// name={fields.country.name}
							// defaultValue={fields.country.defaultValue}
						/>
						<Field.Description className="description">
							Select is synchronized with a scalar BaseControl.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.country.errors?.length ? 'alert' : undefined}
						>
							{fields.country.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.framework.valid}>
						<Field.Label className="label">Framework</Field.Label>
						<ComboboxControl
							placeholder="Search frameworks"
							triggerLabel="Open Framework"
							items={frameworkOptions}
							{...fields.framework.comboboxProps}
							// Equivalent to:
							// name={fields.framework.name}
							// defaultValue={fields.framework.defaultValue}
						/>
						<Field.Description className="description">
							Filtering is transient; BaseControl stores the selection.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.framework.errors?.length ? 'alert' : undefined}
						>
							{fields.framework.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.quantity.valid}>
						<Field.Label className="label">Quantity</Field.Label>
						<NumberFieldControl
							label="Quantity"
							{...fields.quantity.numberFieldProps}
							// Equivalent to:
							// name={fields.quantity.name}
							// defaultValue={fields.quantity.defaultValue}
						/>
						<Field.Description className="description">
							BaseControl stores the raw value before Zod coercion.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.quantity.errors?.length ? 'alert' : undefined}
						>
							{fields.quantity.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.budget.valid}>
						<Field.Label className="label">Budget</Field.Label>
						<SliderControl
							{...fields.budget.sliderProps}
							// Equivalent to:
							// name={fields.budget.name}
							// defaultValue={fields.budget.defaultValue}
						/>
						<Field.Description className="description">
							The range input is controlled through useControl.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.budget.errors?.length ? 'alert' : undefined}
						>
							{fields.budget.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.notifications.valid}>
						<div className="switch-row">
							<Field.Label className="label">Product notifications</Field.Label>
							<SwitchControl
								{...fields.notifications.switchProps}
								// Equivalent to:
								// name={fields.notifications.name}
								// defaultChecked={fields.notifications.defaultChecked}
							/>
						</div>
						<Field.Description className="description">
							A checkbox BaseControl submits “on” while enabled.
						</Field.Description>
						<Field.Error
							className="error"
							match
							role={fields.notifications.errors?.length ? 'alert' : undefined}
						>
							{fields.notifications.errors?.join(', ')}
						</Field.Error>
					</Field.Root>
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
