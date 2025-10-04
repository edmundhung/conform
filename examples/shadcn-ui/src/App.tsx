import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { z } from 'zod';
import {
	Field,
	FieldLabel,
	FieldError,
	Button,
	Input,
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
} from './components/form';

const schema = z.object({
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
});

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		defaultValue: {
			name: searchParams.get('name'),
			dateOfBirth: searchParams.get('dateOfBirth'),
			country: searchParams.get('country'),
			gender: searchParams.get('gender'),
			agreeToTerms: searchParams.get('agreeToTerms'),
			job: searchParams.get('job'),
			age: searchParams.get('age'),
			isAdult: searchParams.get('isAdult'),
			description: searchParams.get('description'),
			accountType: searchParams.get('accountType'),
			categories: searchParams.getAll('categories'),
			interests: searchParams.getAll('interests'),
			code: searchParams.get('code'),
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		onSubmit(event, { formData, submission }) {
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

			if (submission?.status === 'success') {
				setSubmittedValue(submission.value);
			}
		},
	});

	return (
		<div className="flex flex-col gap-6 p-10">
			<h1 className="text-2xl">Shadcn UI Example</h1>
			<form
				method="POST"
				id={form.id}
				onSubmit={form.onSubmit}
				onChange={() => setSubmittedValue(null)}
				className="flex flex-col gap-4 items-start"
				noValidate
			>
				<Field>
					<FieldLabel>Name</FieldLabel>
					<Input
						id={fields.name.id}
						type="text"
						name={fields.name.name}
						defaultValue={fields.name.defaultValue}
						aria-describedby={
							!fields.name.valid ? fields.name.errorId : undefined
						}
					/>
					<FieldError id={fields.name.errorId}>{fields.name.errors}</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.dateOfBirth.id}>Date of Birth</FieldLabel>
					<DatePicker
						id={fields.dateOfBirth.id}
						name={fields.dateOfBirth.name}
						defaultValue={fields.dateOfBirth.defaultValue}
						aria-describedby={
							!fields.dateOfBirth.valid ? fields.dateOfBirth.errorId : undefined
						}
					/>
					<FieldError id={fields.dateOfBirth.errorId}>
						{fields.dateOfBirth.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.country.id}>Country</FieldLabel>
					<ComboBox
						id={fields.country.id}
						name={fields.country.name}
						defaultValue={fields.country.defaultValue}
						aria-describedby={
							!fields.country.valid ? fields.country.errorId : undefined
						}
					/>
					<FieldError id={fields.country.errorId}>
						{fields.country.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.gender.id}>Gender</FieldLabel>
					<RadioGroup
						id={fields.gender.id}
						name={fields.gender.name}
						defaultValue={fields.gender.defaultValue}
						items={[
							{ value: 'male', label: 'male' },
							{ value: 'female', label: 'female' },
							{ value: 'other', label: 'other' },
							{ value: 'invalid', label: 'invalid' },
						]}
						aria-describedby={
							!fields.gender.valid ? fields.gender.errorId : undefined
						}
					/>
					<FieldError id={fields.gender.errorId}>
						{fields.gender.errors}
					</FieldError>
				</Field>
				<Field>
					<div className="flex gap-2 items-center">
						<Checkbox
							id={fields.agreeToTerms.id}
							name={fields.agreeToTerms.name}
							defaultChecked={fields.agreeToTerms.defaultChecked}
							aria-describedby={
								!fields.agreeToTerms.valid
									? fields.agreeToTerms.errorId
									: undefined
							}
						/>
						<FieldLabel htmlFor={fields.agreeToTerms.id}>
							Agree to terms
						</FieldLabel>
					</div>
					<FieldError id={fields.agreeToTerms.errorId}>
						{fields.agreeToTerms.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.job.id}>Job</FieldLabel>
					<Select
						id={fields.job.id}
						placeholder="Select a job"
						name={fields.job.name}
						defaultValue={fields.job.defaultValue}
						items={[
							{ value: 'developer', name: 'Developer' },
							{ value: 'designer', name: 'Designer' },
							{ value: 'manager', name: 'Manager' },
						]}
						aria-describedby={
							!fields.job.valid ? fields.job.errorId : undefined
						}
					/>
					<FieldError id={fields.job.errorId}>{fields.job.errors}</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.age.id}>Age</FieldLabel>
					<Slider
						id={fields.age.id}
						name={fields.age.name}
						defaultValue={fields.age.defaultValue}
						aria-describedby={
							!fields.age.valid ? fields.age.errorId : undefined
						}
					/>
					<FieldError id={fields.age.errorId}>{fields.age.errors}</FieldError>
				</Field>
				<Field>
					<div className="flex items-center gap-2">
						<FieldLabel htmlFor={fields.isAdult.id}>Is adult</FieldLabel>
						<Switch
							id={fields.isAdult.id}
							name={fields.isAdult.name}
							defaultChecked={fields.isAdult.defaultChecked}
							aria-describedby={
								!fields.isAdult.valid ? fields.isAdult.errorId : undefined
							}
						/>
					</div>
					<FieldError id={fields.isAdult.errorId}>
						{fields.isAdult.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.description.id}>Description</FieldLabel>
					<Textarea
						id={fields.description.id}
						name={fields.description.name}
						defaultValue={fields.description.defaultValue}
						aria-describedby={
							!fields.description.valid ? fields.description.errorId : undefined
						}
					/>
					<FieldError id={fields.description.errorId}>
						{fields.description.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel id={fields.accountType.id}>Account type</FieldLabel>
					<SingleToggleGroup
						name={fields.accountType.name}
						defaultValue={fields.accountType.defaultValue}
						items={[
							{ value: 'personal', label: 'Personal' },
							{ value: 'business', label: 'Business' },
						]}
						aria-labelledby={fields.accountType.id}
						aria-describedby={
							!fields.accountType.valid ? fields.accountType.errorId : undefined
						}
					/>
					<FieldError id={fields.accountType.errorId}>
						{fields.accountType.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel id={fields.categories.id}>Categories</FieldLabel>
					<MultiToggleGroup
						name={fields.categories.name}
						defaultValue={fields.categories.defaultOptions}
						items={[
							{ value: 'blog', label: 'Blog' },
							{ value: 'guide', label: 'Guide' },
							{ value: 'tutorial', label: 'Tutorial' },
						]}
						aria-labelledby={fields.categories.id}
						aria-describedby={
							!fields.categories.valid ? fields.categories.errorId : undefined
						}
					/>
					<FieldError id={fields.categories.errorId}>
						{fields.categories.errors}
					</FieldError>
				</Field>
				<Field role="group" aria-labelledby={fields.interests.id}>
					<FieldLabel id={fields.interests.id}>Interests</FieldLabel>
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
						<div key={option.value} className="flex items-center gap-2">
							<Checkbox
								id={`${fields.interests.id}-${option.value}`}
								name={fields.interests.name}
								value={option.value}
								defaultChecked={fields.interests.defaultOptions?.includes(
									option.value,
								)}
								aria-describedby={
									!fields.interests.valid ? fields.interests.errorId : undefined
								}
							/>
							<label htmlFor={`${fields.interests.id}-${option.value}`}>
								{option.name}
							</label>
						</div>
					))}
					<FieldError id={fields.interests.errorId}>
						{fields.interests.errors}
					</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={fields.code.id}>Code</FieldLabel>
					<InputOTP
						id={fields.code.id}
						name={fields.code.name}
						defaultValue={fields.code.defaultValue}
						length={6}
						aria-describedby={
							!fields.code.valid ? fields.code.errorId : undefined
						}
					/>
					<FieldError id={fields.code.errorId}>{fields.code.errors}</FieldError>
				</Field>

				{submittedValue ? (
					<div>
						<h4>Value submitted</h4>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</div>
				) : null}

				<div className="flex gap-2">
					<Button type="submit">Submit</Button>
					<Button type="button" variant="outline" onClick={() => form.reset()}>
						Reset
					</Button>
				</div>
			</form>
		</div>
	);
}
