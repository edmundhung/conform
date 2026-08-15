import { coerceFormValue } from '@conform-to/zod/v4/future';
import { useState } from 'react';
import { z } from 'zod/v4';
import {
	Field,
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
} from './components/form-controls';
import { useForm } from './forms';

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
		defaultValue: searchParams,
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const searchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(searchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<div className="flex flex-col gap-6 p-10">
			<h1 className="text-2xl">shadcn/ui with Radix</h1>
			<form
				{...form.props}
				method="POST"
				onChange={() => setSubmittedValue(null)}
				className="flex flex-col gap-4 items-start"
			>
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
								// aria-describedby={fields.name.ariaDescribedBy}
							/>
						</InputGroup>
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
							// aria-describedby={fields.dateOfBirth.ariaDescribedBy}
						/>
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
							// aria-describedby={fields.country.ariaDescribedBy}
						/>
						<FieldError id={fields.country.errorId}>
							{fields.country.errors}
						</FieldError>
					</Field>
					<FieldSet data-invalid={fields.gender.ariaInvalid}>
						<FieldLegend id={`${fields.gender.id}-label`}>Gender</FieldLegend>
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
							// aria-describedby={fields.gender.ariaDescribedBy}
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
								// aria-describedby={fields.agreeToTerms.ariaDescribedBy}
							/>
							<FieldLabel htmlFor={fields.agreeToTerms.id}>
								Agree to terms
							</FieldLabel>
						</div>
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
							// aria-describedby={fields.job.ariaDescribedBy}
						/>
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
							// aria-describedby={fields.age.ariaDescribedBy}
						/>
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
								// aria-describedby={fields.isAdult.ariaDescribedBy}
							/>
						</div>
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
							// aria-describedby={fields.description.ariaDescribedBy}
						/>
						<FieldError id={fields.description.errorId}>
							{fields.description.errors}
						</FieldError>
					</Field>
					<FieldSet data-invalid={fields.accountType.ariaInvalid}>
						<FieldLegend id={`${fields.accountType.id}-label`}>
							Account type
						</FieldLegend>
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
							// aria-describedby={fields.accountType.ariaDescribedBy}
						/>
						<FieldError id={fields.accountType.errorId}>
							{fields.accountType.errors}
						</FieldError>
					</FieldSet>
					<FieldSet data-invalid={fields.categories.ariaInvalid}>
						<FieldLegend id={`${fields.categories.id}-label`}>
							Categories
						</FieldLegend>
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
							// aria-describedby={fields.categories.ariaDescribedBy}
						/>
						<FieldError id={fields.categories.errorId}>
							{fields.categories.errors}
						</FieldError>
					</FieldSet>
					<FieldSet data-invalid={fields.interests.ariaInvalid}>
						<FieldLegend id={fields.interests.id}>Interests</FieldLegend>
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
									aria-describedby={fields.interests.ariaDescribedBy}
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
						<TeamMemberSelect
							{...fields.members.teamMemberSelectProps}
							// Equivalent to:
							// name={fields.members.name}
							// defaultValue={fields.members.defaultPayload}
							// aria-labelledby={fields.members.id}
							// aria-invalid={fields.members.ariaInvalid}
							// aria-describedby={fields.members.ariaDescribedBy}
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
							// aria-describedby={fields.code.ariaDescribedBy}
						/>
						<FieldError id={fields.code.errorId}>
							{fields.code.errors}
						</FieldError>
					</Field>
				</FieldGroup>

				{submittedValue ? (
					<div>
						<h4>Value submitted</h4>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</div>
				) : null}

				<div className="flex gap-2">
					<Button type="submit">Submit</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => intent.reset()}
					>
						Reset
					</Button>
				</div>
			</form>
		</div>
	);
}
