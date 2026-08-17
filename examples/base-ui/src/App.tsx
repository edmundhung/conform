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
						<Field.Label id={`${fields.fullName.id}-label`} className="label">
							Full name
						</Field.Label>
						<Input
							className="text-control"
							{...fields.fullName.inputProps}
							// Equivalent to:
							// id={fields.fullName.id}
							// name={fields.fullName.name}
							// defaultValue={fields.fullName.defaultValue}
							// aria-labelledby={`${fields.fullName.id}-label`}
							// aria-describedby={`${fields.fullName.id}-description ${fields.fullName.ariaDescribedBy ?? ''}`.trim()}
							// aria-invalid={fields.fullName.ariaInvalid}
						/>
						<Field.Description
							id={`${fields.fullName.id}-description`}
							className="description"
						>
							A native Base UI Input.
						</Field.Description>
						<Field.Error
							id={fields.fullName.errorId}
							className="error"
							match
							role={fields.fullName.errors?.length ? 'alert' : undefined}
						>
							{fields.fullName.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.bio.valid}>
						<Field.Label id={`${fields.bio.id}-label`} className="label">
							Bio
						</Field.Label>
						<Field.Control
							render={<textarea rows={4} />}
							className="text-control"
							{...fields.bio.textareaProps}
							// Equivalent to:
							// id={fields.bio.id}
							// name={fields.bio.name}
							// defaultValue={fields.bio.defaultValue}
							// aria-labelledby={`${fields.bio.id}-label`}
							// aria-describedby={`${fields.bio.id}-description ${fields.bio.ariaDescribedBy ?? ''}`.trim()}
							// aria-invalid={fields.bio.ariaInvalid}
						/>
						<Field.Description
							id={`${fields.bio.id}-description`}
							className="description"
						>
							Field.Control renders a native textarea.
						</Field.Description>
						<Field.Error
							id={fields.bio.errorId}
							className="error"
							match
							role={fields.bio.errors?.length ? 'alert' : undefined}
						>
							{fields.bio.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.acceptTerms.valid}>
						<Field.Label
							id={`${fields.acceptTerms.id}-label`}
							className="choice-label"
						>
							<CheckboxControl
								{...fields.acceptTerms.checkboxProps}
								// Equivalent to:
								// id={fields.acceptTerms.id}
								// name={fields.acceptTerms.name}
								// defaultChecked={fields.acceptTerms.defaultChecked}
								// aria-labelledby={`${fields.acceptTerms.id}-label`}
								// aria-describedby={`${fields.acceptTerms.id}-description ${fields.acceptTerms.ariaDescribedBy ?? ''}`.trim()}
								// invalid={!fields.acceptTerms.valid}
							/>
							Accept terms
						</Field.Label>
						<Field.Description
							id={`${fields.acceptTerms.id}-description`}
							className="description"
						>
							The visible checkbox is synchronized with a BaseControl.
						</Field.Description>
						<Field.Error
							id={fields.acceptTerms.errorId}
							className="error"
							match
							role={fields.acceptTerms.errors?.length ? 'alert' : undefined}
						>
							{fields.acceptTerms.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.interests.valid}>
						<Field.Label id={`${fields.interests.id}-label`} className="label">
							Interests
						</Field.Label>
						<CheckboxGroupControl
							{...fields.interests.checkboxGroupProps}
							// Equivalent to:
							// id={fields.interests.id}
							// name={fields.interests.name}
							// defaultValue={fields.interests.defaultOptions}
							// aria-labelledby={`${fields.interests.id}-label`}
							// aria-describedby={`${fields.interests.id}-description ${fields.interests.ariaDescribedBy ?? ''}`.trim()}
							// invalid={!fields.interests.valid}
						>
							{interestOptions.map((item) => (
								<label className="choice-label" key={item.value}>
									<Checkbox.Root
										className="checkbox"
										value={item.value}
										aria-labelledby={`${fields.interests.id}-${item.value}-label`}
									>
										<Checkbox.Indicator className="checkbox-indicator">
											✓
										</Checkbox.Indicator>
									</Checkbox.Root>
									<span id={`${fields.interests.id}-${item.value}-label`}>
										{item.label}
									</span>
								</label>
							))}
						</CheckboxGroupControl>
						<Field.Description
							id={`${fields.interests.id}-description`}
							className="description"
						>
							A multiple BaseControl serializes the selected values.
						</Field.Description>
						<Field.Error
							id={fields.interests.errorId}
							className="error"
							match
							role={fields.interests.errors?.length ? 'alert' : undefined}
						>
							{fields.interests.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.plan.valid}>
						<Field.Label id={`${fields.plan.id}-label`} className="label">
							Plan
						</Field.Label>
						<RadioGroupControl
							{...fields.plan.radioGroupProps}
							// Equivalent to:
							// id={fields.plan.id}
							// name={fields.plan.name}
							// defaultValue={fields.plan.defaultValue}
							// aria-labelledby={`${fields.plan.id}-label`}
							// aria-describedby={`${fields.plan.id}-description ${fields.plan.ariaDescribedBy ?? ''}`.trim()}
							// invalid={!fields.plan.valid}
						>
							{planOptions.map((item) => (
								<label className="choice-label" key={item.value}>
									<Radio.Root
										className="radio"
										value={item.value}
										aria-labelledby={`${fields.plan.id}-${item.value}-label`}
									>
										<Radio.Indicator className="radio-indicator" />
									</Radio.Root>
									<span id={`${fields.plan.id}-${item.value}-label`}>
										{item.label}
									</span>
								</label>
							))}
						</RadioGroupControl>
						<Field.Description
							id={`${fields.plan.id}-description`}
							className="description"
						>
							The BaseControl serializes one scalar value.
						</Field.Description>
						<Field.Error
							id={fields.plan.errorId}
							className="error"
							match
							role={fields.plan.errors?.length ? 'alert' : undefined}
						>
							{fields.plan.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.country.valid}>
						<Field.Label id={`${fields.country.id}-label`} className="label">
							Country
						</Field.Label>
						<SelectControl
							placeholder="Choose a country"
							items={countryOptions}
							{...fields.country.selectProps}
							// Equivalent to:
							// id={fields.country.id}
							// name={fields.country.name}
							// defaultValue={fields.country.defaultValue}
							// aria-labelledby={`${fields.country.id}-label`}
							// aria-describedby={`${fields.country.id}-description ${fields.country.ariaDescribedBy ?? ''}`.trim()}
							// invalid={!fields.country.valid}
						/>
						<Field.Description
							id={`${fields.country.id}-description`}
							className="description"
						>
							Select is synchronized with a scalar BaseControl.
						</Field.Description>
						<Field.Error
							id={fields.country.errorId}
							className="error"
							match
							role={fields.country.errors?.length ? 'alert' : undefined}
						>
							{fields.country.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.framework.valid}>
						<Field.Label id={`${fields.framework.id}-label`} className="label">
							Framework
						</Field.Label>
						<ComboboxControl
							placeholder="Search frameworks"
							triggerLabel="Open Framework"
							items={frameworkOptions}
							{...fields.framework.comboboxProps}
							// Equivalent to:
							// id={fields.framework.id}
							// name={fields.framework.name}
							// defaultValue={fields.framework.defaultValue}
							// aria-labelledby={`${fields.framework.id}-label`}
							// aria-describedby={`${fields.framework.id}-description ${fields.framework.ariaDescribedBy ?? ''}`.trim()}
							// invalid={!fields.framework.valid}
						/>
						<Field.Description
							id={`${fields.framework.id}-description`}
							className="description"
						>
							Filtering is transient; BaseControl stores the selection.
						</Field.Description>
						<Field.Error
							id={fields.framework.errorId}
							className="error"
							match
							role={fields.framework.errors?.length ? 'alert' : undefined}
						>
							{fields.framework.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.quantity.valid}>
						<Field.Label id={`${fields.quantity.id}-label`} className="label">
							Quantity
						</Field.Label>
						<NumberFieldControl
							label="Quantity"
							{...fields.quantity.numberFieldProps}
							// Equivalent to:
							// id={fields.quantity.id}
							// name={fields.quantity.name}
							// defaultValue={fields.quantity.defaultValue}
							// aria-labelledby={`${fields.quantity.id}-label`}
							// aria-describedby={`${fields.quantity.id}-description ${fields.quantity.ariaDescribedBy ?? ''}`.trim()}
							// invalid={!fields.quantity.valid}
						/>
						<Field.Description
							id={`${fields.quantity.id}-description`}
							className="description"
						>
							BaseControl stores the raw value before Zod coercion.
						</Field.Description>
						<Field.Error
							id={fields.quantity.errorId}
							className="error"
							match
							role={fields.quantity.errors?.length ? 'alert' : undefined}
						>
							{fields.quantity.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.budget.valid}>
						<Field.Label id={`${fields.budget.id}-label`} className="label">
							Budget
						</Field.Label>
						<SliderControl
							{...fields.budget.sliderProps}
							// Equivalent to:
							// id={fields.budget.id}
							// name={fields.budget.name}
							// defaultValue={fields.budget.defaultValue}
							// aria-labelledby={`${fields.budget.id}-label`}
							// aria-describedby={`${fields.budget.id}-description ${fields.budget.ariaDescribedBy ?? ''}`.trim()}
							// invalid={!fields.budget.valid}
						/>
						<Field.Description
							id={`${fields.budget.id}-description`}
							className="description"
						>
							The range input is controlled through useControl.
						</Field.Description>
						<Field.Error
							id={fields.budget.errorId}
							className="error"
							match
							role={fields.budget.errors?.length ? 'alert' : undefined}
						>
							{fields.budget.errors?.join(', ')}
						</Field.Error>
					</Field.Root>

					<Field.Root className="field" invalid={!fields.notifications.valid}>
						<div className="switch-row">
							<Field.Label
								id={`${fields.notifications.id}-label`}
								className="label"
							>
								Product notifications
							</Field.Label>
							<SwitchControl
								{...fields.notifications.switchProps}
								// Equivalent to:
								// id={fields.notifications.id}
								// name={fields.notifications.name}
								// defaultChecked={fields.notifications.defaultChecked}
								// aria-labelledby={`${fields.notifications.id}-label`}
								// aria-describedby={`${fields.notifications.id}-description ${fields.notifications.ariaDescribedBy ?? ''}`.trim()}
								// invalid={!fields.notifications.valid}
							/>
						</div>
						<Field.Description
							id={`${fields.notifications.id}-description`}
							className="description"
						>
							A checkbox BaseControl submits “on” while enabled.
						</Field.Description>
						<Field.Error
							id={fields.notifications.errorId}
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
