import { Field, FieldError } from '@/components/Field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { InputConform } from './components/conform/Input';
import { DatePickerConform } from './components/conform/DatePicker';
import { CountryPickerConform } from './components/conform/CountryPicker';
import { RadioGroupConform } from './components/conform/RadioGroup';
import { CheckboxConform } from './components/conform/Checkbox';
import { SelectConform } from './components/conform/Select';
import { SliderConform } from './components/conform/Slider';
import { SwitchConform } from './components/conform/Switch';
import { TextareaConform } from './components/conform/Textarea';
import { ToggleGroupConform } from './components/conform/ToggleGroup';
import { CheckboxGroupConform } from './components/conform/CheckboxGroup';
import { InputOTPConform } from './components/conform/InputOTP';

const UserSubscriptionSchema = z.object({
	name: z
		.string({ required_error: 'Name is required' })
		.min(3, { message: 'Name must be at least 3 characters long' }),
	dateOfBirth: z
		.date({
			required_error: 'Date of birth is required',
			invalid_type_error: 'Invalid date',
		})
		.max(new Date(), { message: 'Date of birth cannot be in the future' }),
	country: z.string({ required_error: 'Country is required' }),
	gender: z.enum(['male', 'female', 'other'], {
		required_error: 'Gender is required',
	}),
	agreeToTerms: z.boolean({ required_error: 'You must agree to the terms' }),
	job: z.enum(['developer', 'designer', 'manager'], {
		required_error: 'You must select a job',
	}),
	age: z.number().min(18, 'You must have be more than 18'),
	isAdult: z
		.boolean()
		.optional()
		.refine((val) => val == true, 'You must be an adult'),
	description: z.string().min(10, 'Description must be at least 10 characters'),
	accountType: z.enum(['personal', 'business'], {
		required_error: 'You must select an account type',
	}),
	accountTypes: z.array(z.enum(['personal', 'business'])),
	interests: z
		.array(z.string())
		.min(3, 'You must select at least three interest'),
	code: z.string().length(6, 'Code must be 6 characters long'),
});

function App() {
	const [form, fields] = useForm({
		id: 'signup',
		onValidate({ formData }) {
			const result = parseWithZod(formData, { schema: UserSubscriptionSchema });
			if (result.status==='error') {
				console.error(result);
			}
			return result
		},
		onSubmit(e) {
			e.preventDefault();
			const form = e.currentTarget;
			const formData = new FormData(form);
			const result = parseWithZod(formData, { schema: UserSubscriptionSchema });
			alert(JSON.stringify(result, null, 2));
		},
		shouldRevalidate: 'onInput',
	});
	return (
		<div className="flex flex-col gap-6 p-10">
			<h1 className="text-2xl">Shadcn + Conform example</h1>
			<form
				method="POST"
				id={form.id}
				onSubmit={form.onSubmit}
				className="flex flex-col gap-4 items-start"
			>
				<Field>
					<Label htmlFor={fields.name.id}>Name</Label>
					<InputConform meta={fields.name} type="text" />
					{fields.name.errors && <FieldError>{fields.name.errors}</FieldError>}
				</Field>
				<Field>
					<Label htmlFor={fields.dateOfBirth.id}>Birth date</Label>
					<DatePickerConform meta={fields.dateOfBirth} />
					{fields.dateOfBirth.errors && (
						<FieldError>{fields.dateOfBirth.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.country.id}>Country</Label>
					<CountryPickerConform meta={fields.country} />
					{fields.country.errors && (
						<FieldError>{fields.country.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.gender.id}>Gender</Label>
					<RadioGroupConform
						meta={fields.gender}
						items={[
							{ value: 'male', label: 'male' },
							{ value: 'female', label: 'female' },
							{ value: 'other', label: 'other' },
						]}
					/>
					{fields.gender.errors && (
						<FieldError>{fields.gender.errors}</FieldError>
					)}
				</Field>
				<Field>
					<div className="flex gap-2 items-center">
						<CheckboxConform meta={fields.agreeToTerms} />
						<Label htmlFor={fields.agreeToTerms.id}>Agree to terms</Label>
					</div>
					{fields.agreeToTerms.errors && (
						<FieldError>{fields.agreeToTerms.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.job.id}>Job</Label>
					<SelectConform
						placeholder="Select a job"
						meta={fields.job}
						items={[
							{ value: 'developer', name: 'Developer' },
							{ value: 'designer', name: 'Design' },
							{ value: 'manager', name: 'Manager' },
						]}
					/>
					{fields.job.errors && <FieldError>{fields.job.errors}</FieldError>}
				</Field>
				<Field>
					<Label htmlFor={fields.age.id}>Age</Label>
					<SliderConform meta={fields.age} step={1} />
					{fields.age.errors && <FieldError>{fields.age.errors}</FieldError>}
				</Field>
				<Field>
					<div className="flex items-center gap-2">
						<Label htmlFor={fields.isAdult.id}>Is adult</Label>
						<SwitchConform meta={fields.isAdult} />
					</div>
					{fields.isAdult.errors && (
						<FieldError>{fields.isAdult.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.description.id}>Description</Label>
					<TextareaConform meta={fields.description} />
					{fields.description.errors && (
						<FieldError>{fields.description.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.accountType.id}>Account type</Label>
					<ToggleGroupConform
						type="single"
						meta={fields.accountType}
						items={[
							{ value: 'personal', label: 'Personal' },
							{ value: 'business', label: 'Business' },
						]}
					/>
					{fields.accountType.errors && (
						<FieldError>{fields.accountType.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.accountTypes.id}>Account types</Label>
					<ToggleGroupConform
						type="multiple"
						meta={fields.accountTypes}
						items={[
							{ value: 'personal', label: 'Personal' },
							{ value: 'business', label: 'Business' },
							{ value: 'business2', label: 'Business2' },
						]}
					/>
					{fields.accountTypes.errors && (
						<FieldError>{fields.accountTypes.errors}</FieldError>
					)}
				</Field>
				<Field>
					<fieldset>Interests</fieldset>
					<CheckboxGroupConform
						meta={fields.interests}
						items={[
							{ value: 'react', name: 'React' },
							{ value: 'vue', name: 'Vue' },
							{ value: 'svelte', name: 'Svelte' },
							{ value: 'angular', name: 'Angular' },
							{ value: 'ember', name: 'Ember' },
							{ value: 'next', name: 'Next' },
							{ value: 'nuxt', name: 'Nuxt' },
							{ value: 'sapper', name: 'Sapper' },
							{ value: 'glimmer', name: 'Glimmer' },
						]}
					/>
					{fields.interests.errors && (
						<FieldError>{fields.interests.errors}</FieldError>
					)}
				</Field>
				<Field>
					<Label htmlFor={fields.code.id}>Code</Label>
					<InputOTPConform meta={fields.code} length={6} />
					{fields.code.errors && <FieldError>{fields.code.errors}</FieldError>}
				</Field>

				<div className="flex gap-2">
					<Button type="submit">Submit</Button>
					<Button type="reset" variant="outline">
						Reset
					</Button>
				</div>
			</form>
		</div>
	);
}

export default App;
