import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { z } from 'zod';
import {
	Field,
	FieldError,
	Button,
	Label,
	Input,
	Textarea,
	DatePicker,
	CountryPicker,
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
	dateOfBirth: z
		.date()
		.max(new Date(), { message: 'Date of birth cannot be in the future' }),
	country: z.string(),
	gender: z.enum(['male', 'female', 'other']),
	agreeToTerms: z.boolean(),
	job: z.enum(['developer', 'designer', 'manager']),
	age: z.number().min(18),
	isAdult: z
		.boolean()
		.optional()
		.refine((val) => val == true, 'You must be an adult'),
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
					<Label>Name</Label>
					<Input
						type="text"
						name={fields.name.name}
						defaultValue={fields.name.defaultValue}
					/>
					<FieldError>{fields.name.errors}</FieldError>
				</Field>
				<Field>
					<Label>Birth date</Label>
					<DatePicker
						name={fields.dateOfBirth.name}
						defaultValue={fields.dateOfBirth.defaultValue}
					/>
					<FieldError>{fields.dateOfBirth.errors}</FieldError>
				</Field>
				<Field>
					<Label>Country</Label>
					<CountryPicker
						name={fields.country.name}
						defaultValue={fields.country.defaultValue}
					/>
					<FieldError>{fields.country.errors}</FieldError>
				</Field>
				<Field>
					<Label>Gender</Label>
					<RadioGroup
						name={fields.gender.name}
						defaultValue={fields.gender.defaultValue}
						items={[
							{ value: 'male', label: 'male' },
							{ value: 'female', label: 'female' },
							{ value: 'other', label: 'other' },
						]}
					/>
					<FieldError>{fields.gender.errors}</FieldError>
				</Field>
				<Field>
					<div className="flex gap-2 items-center">
						<Checkbox
							name={fields.agreeToTerms.name}
							value="on"
							defaultChecked={fields.agreeToTerms.defaultValue === 'on'}
						/>
						<Label>Agree to terms</Label>
					</div>
					<FieldError>{fields.agreeToTerms.errors}</FieldError>
				</Field>
				<Field>
					<Label>Job</Label>
					<Select
						placeholder="Select a job"
						name={fields.job.name}
						defaultValue={fields.job.defaultOptions}
						items={[
							{ value: 'developer', name: 'Developer' },
							{ value: 'designer', name: 'Design' },
							{ value: 'manager', name: 'Manager' },
						]}
					/>
					<FieldError>{fields.job.errors}</FieldError>
				</Field>
				<Field>
					<Label>Age</Label>
					<Slider
						name={fields.age.name}
						defaultValue={fields.age.defaultValue}
					/>
					<FieldError>{fields.age.errors}</FieldError>
				</Field>
				<Field>
					<div className="flex items-center gap-2">
						<Label>Is adult</Label>
						<Switch
							name={fields.isAdult.name}
							defaultChecked={fields.isAdult.defaultValue === 'on'}
						/>
					</div>
					<FieldError>{fields.isAdult.errors}</FieldError>
				</Field>
				<Field>
					<Label>Description</Label>
					<Textarea
						name={fields.description.name}
						defaultValue={fields.description.defaultValue}
					/>
					<FieldError>{fields.description.errors}</FieldError>
				</Field>
				<Field>
					<Label>Account type</Label>
					<SingleToggleGroup
						name={fields.accountType.name}
						defaultValue={fields.accountType.defaultValue}
						items={[
							{ value: 'personal', label: 'Personal' },
							{ value: 'business', label: 'Business' },
						]}
					/>
					<FieldError>{fields.accountType.errors}</FieldError>
				</Field>
				<Field>
					<Label>Categories</Label>
					<MultiToggleGroup
						name={fields.categories.name}
						defaultValue={fields.categories.defaultOptions}
						items={[
							{ value: 'blog', label: 'Blog' },
							{ value: 'guide', label: 'Guide' },
							{ value: 'tutorial', label: 'Tutorial' },
						]}
					/>
					<FieldError>{fields.categories.errors}</FieldError>
				</Field>
				<Field>
					<fieldset>Interests</fieldset>
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
								name={fields.interests.name}
								value={option.value}
								defaultChecked={fields.interests.defaultOptions?.includes(
									option.value,
								)}
							/>
							<label>{option.name}</label>
						</div>
					))}
					<FieldError>{fields.interests.errors}</FieldError>
				</Field>
				<Field>
					<Label>Code</Label>
					<InputOTP
						name={fields.code.name}
						defaultValue={fields.code.defaultValue}
						length={6}
					/>
					<FieldError>{fields.code.errors}</FieldError>
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
