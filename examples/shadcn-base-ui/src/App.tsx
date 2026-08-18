import { coerceFormValue } from '@conform-to/zod/v4/future';
import { AtSignIcon } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod/v4';

import {
	DatePicker,
	FormCheckbox,
	FormCombobox,
	FormRadioGroup,
	FormSelect,
	FormSlider,
	FormSwitch,
	InputOTP,
	MultiCombobox,
	useForm,
} from './forms';
import { Button } from './components/ui/button';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from './components/ui/field';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from './components/ui/input-group';
import {
	NativeSelect,
	NativeSelectOption,
} from './components/ui/native-select';
import { RadioGroupItem } from './components/ui/radio-group';
import { Textarea } from './components/ui/textarea';

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
		interests: z.array(z.string()).min(3),
		code: z.string().length(6),
	}),
);

export function App() {
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

			// Demo only - This emulates a GET request with the form data in the URL.
			const url = new URL(document.URL);
			const nextSearchParams = new URLSearchParams(
				Array.from(formData).filter(
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
				className="mx-auto w-full max-w-2xl space-y-8 rounded-xl border bg-background p-6 shadow-sm md:p-10"
				onChange={() => setSubmittedValue(null)}
			>
				<header className="space-y-2">
					<p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
						Conform × shadcn/ui
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						shadcn/ui with Base UI
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
							<InputGroupAddon>
								<AtSignIcon />
							</InputGroupAddon>
							<InputGroupInput
								{...fields.name.inputProps}
								// Equivalent to:
								// id={fields.name.id}
								// name={fields.name.name}
								// defaultValue={fields.name.defaultValue}
								// aria-invalid={fields.name.ariaInvalid}
								// aria-describedby={[fields.name.descriptionId, fields.name.ariaDescribedBy].filter(Boolean).join(' ')}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>Public</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						<FieldDescription id={fields.name.descriptionId}>
							A native input receives Conform props directly. Use at least three
							characters.
						</FieldDescription>
						<FieldError id={fields.name.errorId}>
							{fields.name.errors}
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

					<Field data-invalid={fields.accountType.ariaInvalid}>
						<FieldLabel htmlFor={fields.accountType.id}>
							Account type
						</FieldLabel>
						<NativeSelect
							{...fields.accountType.nativeSelectProps}
							// Equivalent to:
							// id={fields.accountType.id}
							// name={fields.accountType.name}
							// defaultValue={fields.accountType.defaultValue}
							// aria-invalid={fields.accountType.ariaInvalid}
							// aria-describedby={[fields.accountType.descriptionId, fields.accountType.ariaDescribedBy].filter(Boolean).join(' ')}
						>
							<NativeSelectOption value="">
								Choose an account
							</NativeSelectOption>
							<NativeSelectOption value="personal">Personal</NativeSelectOption>
							<NativeSelectOption value="business">Business</NativeSelectOption>
						</NativeSelect>
						<FieldDescription id={fields.accountType.descriptionId}>
							The browser-native select owns its name and serialization.
						</FieldDescription>
						<FieldError id={fields.accountType.errorId}>
							{fields.accountType.errors}
						</FieldError>
					</Field>

					<FieldSet data-invalid={fields.gender.ariaInvalid}>
						<FieldLegend id={`${fields.gender.id}-label`}>Gender</FieldLegend>
						<FieldDescription id={fields.gender.descriptionId}>
							A scalar BaseControl stores the selected radio value.
						</FieldDescription>
						<FormRadioGroup
							{...fields.gender.radioGroupProps}
							// Equivalent to:
							// name={fields.gender.name}
							// defaultValue={fields.gender.defaultValue}
							// aria-labelledby={`${fields.gender.id}-label`}
							// aria-invalid={fields.gender.ariaInvalid}
							// aria-describedby={[fields.gender.descriptionId, fields.gender.ariaDescribedBy].filter(Boolean).join(' ')}
							className="grid-cols-3"
						>
							{(['male', 'female', 'other'] as const).map((value) => (
								<Field key={value} orientation="horizontal">
									<RadioGroupItem
										id={`${fields.gender.id}-${value}`}
										value={value}
										{...fields.gender.radioItemProps}
									/>
									<FieldLabel htmlFor={`${fields.gender.id}-${value}`}>
										{value[0]?.toUpperCase() + value.slice(1)}
									</FieldLabel>
								</Field>
							))}
						</FormRadioGroup>
						<FieldError id={fields.gender.errorId}>
							{fields.gender.errors}
						</FieldError>
					</FieldSet>

					<Field
						data-invalid={fields.agreeToTerms.ariaInvalid}
						orientation="horizontal"
					>
						<FormCheckbox
							{...fields.agreeToTerms.checkboxProps}
							// Equivalent to:
							// id={fields.agreeToTerms.id}
							// name={fields.agreeToTerms.name}
							// value="on"
							// defaultChecked={fields.agreeToTerms.defaultChecked}
							// aria-invalid={fields.agreeToTerms.ariaInvalid}
							// aria-describedby={[fields.agreeToTerms.descriptionId, fields.agreeToTerms.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldContent>
							<FieldLabel htmlFor={fields.agreeToTerms.id}>
								Agree to terms
							</FieldLabel>
							<FieldDescription id={fields.agreeToTerms.descriptionId}>
								The visible checkbox is synchronized with a checkbox
								BaseControl.
							</FieldDescription>
							<FieldError id={fields.agreeToTerms.errorId}>
								{fields.agreeToTerms.errors}
							</FieldError>
						</FieldContent>
					</Field>

					<Field data-invalid={fields.job.ariaInvalid}>
						<FieldLabel htmlFor={fields.job.id}>Job</FieldLabel>
						<FormSelect
							items={[
								{ label: 'Developer', value: 'developer' },
								{ label: 'Designer', value: 'designer' },
								{ label: 'Manager', value: 'manager' },
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

					<Field data-invalid={fields.country.ariaInvalid}>
						<FieldLabel htmlFor={fields.country.id}>Country</FieldLabel>
						<FormCombobox
							items={[
								{ label: 'Afghanistan', value: 'AF' },
								{ label: 'Åland Islands', value: 'AX' },
								{ label: 'Italy', value: 'IT' },
								{ label: 'Japan', value: 'JP' },
								{ label: 'United States', value: 'US' },
							]}
							{...fields.country.comboboxProps}
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

					<Field data-invalid={fields.age.ariaInvalid}>
						<FieldLabel id={`${fields.age.id}-label`}>Age</FieldLabel>
						<FormSlider
							min={0}
							max={100}
							step={1}
							{...fields.age.sliderProps}
							// Equivalent to:
							// name={fields.age.name}
							// defaultValue={fields.age.defaultValue}
							// aria-labelledby={`${fields.age.id}-label`}
							// aria-invalid={fields.age.ariaInvalid}
							// aria-describedby={[fields.age.descriptionId, fields.age.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.age.descriptionId}>
							The range input is controlled through useControl. You must be at
							least 18.
						</FieldDescription>
						<FieldError id={fields.age.errorId}>{fields.age.errors}</FieldError>
					</Field>

					<Field
						data-invalid={fields.isAdult.ariaInvalid}
						orientation="horizontal"
					>
						<FieldContent>
							<FieldLabel htmlFor={fields.isAdult.id}>Is adult</FieldLabel>
							<FieldDescription id={fields.isAdult.descriptionId}>
								A checkbox BaseControl submits “on” while enabled.
							</FieldDescription>
							<FieldError id={fields.isAdult.errorId}>
								{fields.isAdult.errors}
							</FieldError>
						</FieldContent>
						<FormSwitch
							{...fields.isAdult.switchProps}
							// Equivalent to:
							// id={fields.isAdult.id}
							// name={fields.isAdult.name}
							// value="on"
							// defaultChecked={fields.isAdult.defaultChecked}
							// aria-invalid={fields.isAdult.ariaInvalid}
							// aria-describedby={[fields.isAdult.descriptionId, fields.isAdult.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
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
							The calendar stores an ISO date string in a scalar BaseControl.
						</FieldDescription>
						<FieldError id={fields.dateOfBirth.errorId}>
							{fields.dateOfBirth.errors}
						</FieldError>
					</Field>

					<Field data-invalid={fields.interests.ariaInvalid}>
						<FieldLabel htmlFor={fields.interests.id}>Interests</FieldLabel>
						<MultiCombobox
							items={[
								{ label: 'React', value: 'react' },
								{ label: 'Vue', value: 'vue' },
								{ label: 'Svelte', value: 'svelte' },
								{ label: 'Angular', value: 'angular' },
								{ label: 'Next', value: 'next' },
								{ label: 'Nuxt', value: 'nuxt' },
							]}
							{...fields.interests.multiComboboxProps}
							// Equivalent to:
							// id={fields.interests.id}
							// name={fields.interests.name}
							// defaultValue={fields.interests.defaultOptions}
							// aria-invalid={fields.interests.ariaInvalid}
							// aria-describedby={[fields.interests.descriptionId, fields.interests.ariaDescribedBy].filter(Boolean).join(' ')}
						/>
						<FieldDescription id={fields.interests.descriptionId}>
							A multiple BaseControl serializes each selected value separately.
						</FieldDescription>
						<FieldError id={fields.interests.errorId}>
							{fields.interests.errors}
						</FieldError>
					</Field>

					<Field data-invalid={fields.code.ariaInvalid}>
						<FieldLabel htmlFor={fields.code.id}>Code</FieldLabel>
						<InputOTP
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
							Parsed submission
						</h2>
						<pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
							{JSON.stringify(submittedValue, null, 2)}
						</pre>
					</section>
				) : null}

				<footer className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setSubmittedValue(null);
							intent.reset();
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

export default App;
