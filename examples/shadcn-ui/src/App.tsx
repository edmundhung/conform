import { coerceFormValue } from '@conform-to/zod/v4/future';
import { useState } from 'react';
import { z } from 'zod/v4';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	Button,
	FieldLabel,
	FieldLegend,
	FieldSet,
	InputGroup,
	InputGroupInput,
	Textarea,
	DatePicker,
	ComboBox,
	RadioGroup,
	Checkbox,
	Select,
	Slider,
	Switch,
	SingleToggleGroup,
	MultiToggleGroup,
	InputOTP,
	TeamMemberSelect,
	memberSchema,
	useForm,
} from './forms';

const schema = coerceFormValue(
	z.object({
		name: z.string().min(3),
		dateOfBirth: z.date(),
		country: z.string(),
		gender: z.enum(['male', 'female', 'other']),
		agreeToTerms: z.boolean(),
		job: z.enum(['developer', 'designer', 'manager']),
		age: z.number().min(18),
		isAdult: z.boolean(),
		description: z.string().min(10),
		accountType: z.enum(['personal', 'business']),
		categories: z.array(z.enum(['blog', 'guide', 'tutorial'])).min(1),
		interests: z.array(z.string()).min(3),
		code: z.string().length(6),
		members: z.array(memberSchema).min(1),
	}),
);

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const { form, fields, intent } = useForm(schema, {
		// The URL is the source of the form's defaults in this client-only example.
		defaultValue: searchParams,
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const nextSearchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = nextSearchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(nextSearchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<main className="min-h-svh bg-muted/40 px-4 py-12 md:px-6">
			<form
				{...form.props}
				method="POST"
				onChange={() => setSubmittedValue(null)}
				className="mx-auto w-full max-w-2xl space-y-8 rounded-xl border bg-background p-6 shadow-sm md:p-10"
			>
				<header className="space-y-2">
					<p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
						Conform × shadcn/ui
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						shadcn/ui with Radix
					</h1>
					<p className="text-sm text-muted-foreground">
						Generated shadcn/ui components with Conform owning validation and
						form state.
					</p>
				</header>

				<FieldGroup>
					<Field data-invalid={fields.name.ariaInvalid}>
						<FieldLabel htmlFor={fields.name.id}>Name</FieldLabel>
						<InputGroup>
							<InputGroupInput
								type="text"
								{...fields.name.inputProps}
								// Equivalent to:
								// id={fields.name.id}
								// name={fields.name.name}
								// defaultValue={fields.name.defaultValue}
								// aria-invalid={fields.name.ariaInvalid}
								// aria-describedby={[fields.name.descriptionId, fields.name.ariaDescribedBy].filter(Boolean).join(' ')}
							/>
						</InputGroup>
						<FieldDescription id={fields.name.descriptionId}>
							A native input receives Conform props directly. Use at least three
							characters.
						</FieldDescription>
						<FieldError id={fields.name.errorId}>
							{fields.name.errors}
						</FieldError>
					</Field>
					<Field data-invalid={fields.dateOfBirth.ariaInvalid}>
						<FieldLabel htmlFor={fields.dateOfBirth.id}>
							Date of Birth
						</FieldLabel>
						<DatePicker
							{...fields.dateOfBirth.datePickerProps}
							// Equivalent to:
							// id={fields.dateOfBirth.id}
							// name={fields.dateOfBirth.name}
							// defaultValue={fields.dateOfBirth.defaultValue}
							// aria-invalid={fields.dateOfBirth.ariaInvalid}
							// aria-describedby={[fields.dateOfBirth.descriptionId, fields.dateOfBirth.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.dateOfBirth.descriptionId}>
							A scalar BaseControl stores the selected date as an ISO string.
						</FieldDescription>
						<FieldError id={fields.dateOfBirth.errorId}>
							{fields.dateOfBirth.errors}
						</FieldError>
					</Field>
					<Field data-invalid={fields.country.ariaInvalid}>
						<FieldLabel htmlFor={fields.country.id}>Country</FieldLabel>
						<ComboBox
							{...fields.country.comboBoxProps}
							// Equivalent to:
							// id={fields.country.id}
							// name={fields.country.name}
							// defaultValue={fields.country.defaultValue}
							// aria-invalid={fields.country.ariaInvalid}
							// aria-describedby={[fields.country.descriptionId, fields.country.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.country.descriptionId}>
							Filtering is transient; BaseControl stores the country code.
						</FieldDescription>
						<FieldError id={fields.country.errorId}>
							{fields.country.errors}
						</FieldError>
					</Field>
					<FieldSet data-invalid={fields.gender.ariaInvalid}>
						<FieldLegend id={`${fields.gender.id}-label`}>Gender</FieldLegend>
						<FieldDescription id={fields.gender.descriptionId}>
							A scalar BaseControl stores the selected radio value.
						</FieldDescription>
						<RadioGroup
							items={[
								{ value: 'male', label: 'male' },
								{ value: 'female', label: 'female' },
								{ value: 'other', label: 'other' },
								{ value: 'invalid', label: 'invalid' },
							]}
							{...fields.gender.radioGroupProps}
							// Equivalent to:
							// id={fields.gender.id}
							// name={fields.gender.name}
							// defaultValue={fields.gender.defaultValue}
							// aria-labelledby={`${fields.gender.id}-label`}
							// aria-invalid={fields.gender.ariaInvalid}
							// aria-describedby={[fields.gender.descriptionId, fields.gender.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldError id={fields.gender.errorId}>
							{fields.gender.errors}
						</FieldError>
					</FieldSet>
					<Field data-invalid={fields.agreeToTerms.ariaInvalid}>
						<div className="flex gap-2 items-center">
							<Checkbox
								{...fields.agreeToTerms.checkboxProps}
								// Equivalent to:
								// id={fields.agreeToTerms.id}
								// name={fields.agreeToTerms.name}
								// value="on"
								// defaultChecked={fields.agreeToTerms.defaultChecked}
								// aria-invalid={fields.agreeToTerms.ariaInvalid}
								// aria-describedby={[fields.agreeToTerms.descriptionId, fields.agreeToTerms.ariaDescribedBy].filter(Boolean).join(' ')}
							/>
							<FieldLabel htmlFor={fields.agreeToTerms.id}>
								Agree to terms
							</FieldLabel>
						</div>
						<FieldDescription id={fields.agreeToTerms.descriptionId}>
							The visible checkbox is synchronized with a checkbox BaseControl.
						</FieldDescription>
						<FieldError id={fields.agreeToTerms.errorId}>
							{fields.agreeToTerms.errors}
						</FieldError>
					</Field>
					<Field data-invalid={fields.job.ariaInvalid}>
						<FieldLabel htmlFor={fields.job.id}>Job</FieldLabel>
						<Select
							placeholder="Select a job"
							items={[
								{ value: 'developer', name: 'Developer' },
								{ value: 'designer', name: 'Designer' },
								{ value: 'manager', name: 'Manager' },
							]}
							{...fields.job.selectProps}
							// Equivalent to:
							// id={fields.job.id}
							// name={fields.job.name}
							// defaultValue={fields.job.defaultValue}
							// aria-invalid={fields.job.ariaInvalid}
							// aria-describedby={[fields.job.descriptionId, fields.job.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.job.descriptionId}>
							The compound select is synchronized with a scalar BaseControl.
						</FieldDescription>
						<FieldError id={fields.job.errorId}>{fields.job.errors}</FieldError>
					</Field>
					<Field data-invalid={fields.age.ariaInvalid}>
						<FieldLabel id={`${fields.age.id}-label`} htmlFor={fields.age.id}>
							Age
						</FieldLabel>
						<Slider
							{...fields.age.sliderProps}
							// Equivalent to:
							// id={fields.age.id}
							// name={fields.age.name}
							// defaultValue={fields.age.defaultValue}
							// aria-labelledby={`${fields.age.id}-label`}
							// aria-invalid={fields.age.ariaInvalid}
							// aria-describedby={[fields.age.descriptionId, fields.age.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.age.descriptionId}>
							The slider is controlled through useControl; BaseControl stores
							its numeric string.
						</FieldDescription>
						<FieldError id={fields.age.errorId}>{fields.age.errors}</FieldError>
					</Field>
					<Field data-invalid={fields.isAdult.ariaInvalid}>
						<div className="flex items-center gap-2">
							<FieldLabel htmlFor={fields.isAdult.id}>Is adult</FieldLabel>
							<Switch
								{...fields.isAdult.switchProps}
								// Equivalent to:
								// id={fields.isAdult.id}
								// name={fields.isAdult.name}
								// value="on"
								// defaultChecked={fields.isAdult.defaultChecked}
								// aria-invalid={fields.isAdult.ariaInvalid}
								// aria-describedby={[fields.isAdult.descriptionId, fields.isAdult.ariaDescribedBy].filter(Boolean).join(' ')}
							/>
						</div>
						<FieldDescription id={fields.isAdult.descriptionId}>
							The visible switch is synchronized with a checkbox BaseControl.
						</FieldDescription>
						<FieldError id={fields.isAdult.errorId}>
							{fields.isAdult.errors}
						</FieldError>
					</Field>
					<Field data-invalid={fields.description.ariaInvalid}>
						<FieldLabel htmlFor={fields.description.id}>Description</FieldLabel>
						<Textarea
							{...fields.description.textareaProps}
							// Equivalent to:
							// id={fields.description.id}
							// name={fields.description.name}
							// defaultValue={fields.description.defaultValue}
							// aria-invalid={fields.description.ariaInvalid}
							// aria-describedby={[fields.description.descriptionId, fields.description.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.description.descriptionId}>
							A native textarea receives Conform props directly. Use at least
							ten characters.
						</FieldDescription>
						<FieldError id={fields.description.errorId}>
							{fields.description.errors}
						</FieldError>
					</Field>
					<FieldSet data-invalid={fields.accountType.ariaInvalid}>
						<FieldLegend id={`${fields.accountType.id}-label`}>
							Account type
						</FieldLegend>
						<FieldDescription id={fields.accountType.descriptionId}>
							A scalar BaseControl stores the selected toggle value.
						</FieldDescription>
						<SingleToggleGroup
							items={[
								{ value: 'personal', label: 'Personal' },
								{ value: 'business', label: 'Business' },
							]}
							{...fields.accountType.singleToggleGroupProps}
							// Equivalent to:
							// id={fields.accountType.id}
							// name={fields.accountType.name}
							// defaultValue={fields.accountType.defaultValue}
							// aria-labelledby={`${fields.accountType.id}-label`}
							// aria-invalid={fields.accountType.ariaInvalid}
							// aria-describedby={[fields.accountType.descriptionId, fields.accountType.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldError id={fields.accountType.errorId}>
							{fields.accountType.errors}
						</FieldError>
					</FieldSet>
					<FieldSet data-invalid={fields.categories.ariaInvalid}>
						<FieldLegend id={`${fields.categories.id}-label`}>
							Categories
						</FieldLegend>
						<FieldDescription id={fields.categories.descriptionId}>
							A multiple BaseControl serializes the selected toggles as repeated
							values.
						</FieldDescription>
						<MultiToggleGroup
							items={[
								{ value: 'blog', label: 'Blog' },
								{ value: 'guide', label: 'Guide' },
								{ value: 'tutorial', label: 'Tutorial' },
							]}
							{...fields.categories.multiToggleGroupProps}
							// Equivalent to:
							// id={fields.categories.id}
							// name={fields.categories.name}
							// defaultValue={fields.categories.defaultOptions}
							// aria-labelledby={`${fields.categories.id}-label`}
							// aria-invalid={fields.categories.ariaInvalid}
							// aria-describedby={[fields.categories.descriptionId, fields.categories.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldError id={fields.categories.errorId}>
							{fields.categories.errors}
						</FieldError>
					</FieldSet>
					<FieldSet data-invalid={fields.interests.ariaInvalid}>
						<FieldLegend id={fields.interests.id}>Interests</FieldLegend>
						<FieldDescription id={fields.interests.descriptionId}>
							Checkbox BaseControls with the same name serialize repeated
							values.
						</FieldDescription>
						{[
							{ value: 'react', name: 'React' },
							{ value: 'vue', name: 'Vue' },
							{ value: 'svelte', name: 'Svelte' },
							{ value: 'angular', name: 'Angular' },
							{ value: 'ember', name: 'Ember' },
							{ value: 'next', name: 'Next' },
							{ value: 'nuxt', name: 'Nuxt' },
							{ value: 'sapper', name: 'Sapper' },
							{ value: 'glimmer', name: 'Glimmer' },
						].map((option) => (
							<Field key={option.value} orientation="horizontal">
								<Checkbox
									id={`${fields.interests.id}-${option.value}`}
									name={fields.interests.name}
									value={option.value}
									defaultChecked={fields.interests.defaultOptions?.includes(
										option.value,
									)}
									aria-invalid={fields.interests.ariaInvalid}
									aria-describedby={[
										fields.interests.descriptionId,
										fields.interests.ariaDescribedBy,
									]
										.filter(Boolean)
										.join(' ')}
								/>
								<FieldLabel htmlFor={`${fields.interests.id}-${option.value}`}>
									{option.name}
								</FieldLabel>
							</Field>
						))}
						<FieldError id={fields.interests.errorId}>
							{fields.interests.errors}
						</FieldError>
					</FieldSet>
					<Field data-invalid={fields.members.ariaInvalid}>
						<FieldLabel id={fields.members.id}>Team Members</FieldLabel>
						<FieldDescription id={fields.members.descriptionId}>
							A fieldset BaseControl serializes the selected members as a
							structured array.
						</FieldDescription>
						<TeamMemberSelect
							{...fields.members.teamMemberSelectProps}
							// Equivalent to:
							// name={fields.members.name}
							// defaultValue={fields.members.defaultPayload}
							// aria-labelledby={fields.members.id}
							// aria-invalid={fields.members.ariaInvalid}
							// aria-describedby={[fields.members.descriptionId, fields.members.ariaDescribedBy].filter(Boolean).join(' ')}
							members={[
								{
									id: '1',
									name: 'Alice Chen',
									email: 'alice@example.com',
									role: 'developer',
								},
								{
									id: '2',
									name: 'Bob Smith',
									email: 'bob@example.com',
									role: 'designer',
								},
								{
									id: '3',
									name: 'Carol Davis',
									email: 'carol@example.com',
									role: 'manager',
								},
								{
									id: '4',
									name: 'Dan Wilson',
									email: 'dan@example.com',
									role: 'developer',
								},
								{
									id: '5',
									name: 'Eva Martinez',
									email: 'eva@example.com',
									role: 'designer',
								},
								{
									id: '6',
									name: 'Frank Lee',
									email: 'frank@example.com',
									role: 'developer',
								},
								{
									id: '7',
									name: 'Grace Kim',
									email: 'grace@example.com',
									role: 'manager',
								},
							]}
						/>
						<FieldError id={fields.members.errorId}>
							{fields.members.errors}
						</FieldError>
					</Field>
					<Field data-invalid={fields.code.ariaInvalid}>
						<FieldLabel htmlFor={fields.code.id}>Code</FieldLabel>
						<InputOTP
							length={6}
							{...fields.code.inputOTPProps}
							// Equivalent to:
							// id={fields.code.id}
							// name={fields.code.name}
							// defaultValue={fields.code.defaultValue}
							// aria-invalid={fields.code.ariaInvalid}
							// aria-describedby={[fields.code.descriptionId, fields.code.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.code.descriptionId}>
							BaseControl stores the value from the segmented OTP input.
						</FieldDescription>
						<FieldError id={fields.code.errorId}>
							{fields.code.errors}
						</FieldError>
					</Field>
				</FieldGroup>

				{submittedValue ? (
					<section
						aria-labelledby="submitted-value-heading"
						className="submitted space-y-2"
					>
						<h2 id="submitted-value-heading" className="font-medium">
							Value submitted
						</h2>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</section>
				) : null}

				<footer className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							intent.reset();
							setSubmittedValue(null);
						}}
					>
						Reset
					</Button>
					<Button type="submit">Submit</Button>
				</footer>
			</form>
		</main>
	);
}
