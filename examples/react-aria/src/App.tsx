import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useState } from 'react';
import { z } from 'zod';
import { DateRangePicker } from './components/DateRangePicker';
import { NumberField } from './components/NumberField';
import { Checkbox } from './components/Checkbox';
import { TextField } from './components/TextField';
import { Button } from './components/Button';
import { DatePicker } from './components/DatePicker';
import { RadioGroup, Radio } from './components/RadioGroup';
import { CheckboxGroup } from './components/CheckboxGroup';
import { Select, SelectItem } from './components/Select';
import { ComboBox, ComboBoxItem } from './components/ComboBox';
import { FileTrigger } from './components/FileTrigger';

const schema = z.object({
	email: z.string(),
	price: z.number(),
	language: z.enum(['en', 'de', 'ja']),
	colors: z.enum(['red', 'green', 'blue']).array().min(1),
	date: z.date(),
	range: z.object({
		start: z.string(),
		end: z.string(),
	}),
	category: z.string(),
	author: z.string(),
	profile: z.instanceof(File, { message: 'Required' }),
	acceptTerms: z.boolean(),
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
			email: searchParams.get('email'),
			price: searchParams.get('price'),
			language: searchParams.get('language'),
			colors: searchParams.getAll('colors'),
			date: searchParams.get('date'),
			range: {
				start: searchParams.get('range.start'),
				end: searchParams.get('range.end'),
			},
			category: searchParams.get('category'),
			author: searchParams.get('author'),
			acceptTerms: searchParams.get('acceptTerms'),
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
	const rangeFields = fields.range.getFieldset();

	return (
		<main>
			<form
				id={form.id}
				onSubmit={form.onSubmit}
				onChange={() => setSubmittedValue(null)}
				noValidate
			>
				<div>
					<h3>React Aria Example</h3>
					<p>
						This shows you how to integrate Conform with React Aria Components,
						such as NumberField, ComboBox and FileTrigger.
					</p>
				</div>

				<div>
					<TextField
						label="Email"
						type="email"
						name={fields.email.name}
						defaultValue={fields.email.defaultValue}
						isInvalid={!fields.email.valid}
						errors={fields.email.errors}
					/>
				</div>

				<div>
					<NumberField
						label="Price"
						name={fields.price.name}
						defaultValue={fields.price.defaultValue}
						isInvalid={!fields.price.valid}
						errors={fields.price.errors}
					/>
				</div>

				<div>
					<RadioGroup
						label="Language"
						name={fields.language.name}
						defaultValue={fields.language.defaultValue}
						isInvalid={!fields.language.valid}
						errors={fields.language.errors}
					>
						<Radio value="en">English</Radio>
						<Radio value="de">German</Radio>
						<Radio value="ja">Japanese</Radio>
					</RadioGroup>
				</div>

				<div>
					<CheckboxGroup
						label="Colors"
						name={fields.colors.name}
						defaultValue={fields.colors.defaultOptions}
						isInvalid={!fields.colors.valid}
					>
						<Checkbox value="red">Red</Checkbox>
						<Checkbox value="green">Green</Checkbox>
						<Checkbox value="blue">Blue</Checkbox>
					</CheckboxGroup>
				</div>

				<div>
					<DatePicker
						label="Date"
						granularity="second"
						name={fields.date.name}
						defaultValue={fields.date.defaultValue}
						isInvalid={!fields.date.valid}
						errors={fields.date.errors}
					/>
				</div>

				<div>
					<DateRangePicker
						label="Date Range"
						startName={rangeFields.start.name}
						endName={rangeFields.end.name}
						defaultValue={{
							start: rangeFields.start.defaultValue,
							end: rangeFields.end.defaultValue,
						}}
						isInvalid={!fields.range.valid}
						errors={rangeFields.start.errors ?? rangeFields.end.errors}
					/>
				</div>

				<div>
					<Select
						label="Category"
						name={fields.category.name}
						defaultValue={fields.category.defaultValue}
						isInvalid={!fields.category.valid}
						errors={fields.category.errors}
					>
						<SelectItem id="announcement">Announcement</SelectItem>
						<SelectItem id="blog">Blog</SelectItem>
						<SelectItem id="guide">Guide</SelectItem>
					</Select>
				</div>

				<div>
					<ComboBox
						label="Author"
						name={fields.author.name}
						defaultValue={fields.author.defaultValue}
						isInvalid={!fields.author.valid}
						errors={fields.author.errors}
						allowsCustomValue
					>
						<ComboBoxItem id="carmen">Carmen</ComboBoxItem>
						<ComboBoxItem id="emily">Emily</ComboBoxItem>
						<ComboBoxItem id="james">James</ComboBoxItem>
						<ComboBoxItem id="peter">Peter</ComboBoxItem>
					</ComboBox>
				</div>

				<div>
					<FileTrigger
						label="Profile"
						name={fields.profile.name}
						isInvalid={!fields.profile.valid}
						errors={fields.profile.errors}
					>
						Upload a profile picture
					</FileTrigger>
				</div>

				<div>
					<Checkbox
						name={fields.acceptTerms.name}
						defaultSelected={fields.acceptTerms.defaultValue === 'on'}
						isInvalid={!fields.acceptTerms.valid}
					>
						Accept Terms and Conditions
					</Checkbox>
				</div>

				{submittedValue ? (
					<div>
						<h4>Value submitted</h4>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</div>
				) : null}

				<footer>
					<Button type="button" onClick={() => form.reset()}>
						Reset
					</Button>
					<Button type="submit">Submit</Button>
				</footer>
			</form>
		</main>
	);
}
