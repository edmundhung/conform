import { coerceFormValue } from '@conform-to/zod/v3/future';
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
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
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
		<main>
			<form {...form.props} onChange={() => setSubmittedValue(null)}>
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
						{...fields.email.textFieldProps}
					/>
				</div>

				<div>
					<NumberField label="Price" {...fields.price.numberFieldProps} />
				</div>

				<div>
					<RadioGroup label="Language" {...fields.language.radioGroupProps}>
						<Radio value="en">English</Radio>
						<Radio value="de">German</Radio>
						<Radio value="ja">Japanese</Radio>
						<Radio value="invalid">Invalid</Radio>
					</RadioGroup>
				</div>

				<div>
					<CheckboxGroup label="Colors" {...fields.colors.checkboxGroupProps}>
						<Checkbox value="red">Red</Checkbox>
						<Checkbox value="green">Green</Checkbox>
						<Checkbox value="blue">Blue</Checkbox>
					</CheckboxGroup>
				</div>

				<div>
					<DatePicker
						label="Publish Date"
						granularity="second"
						{...fields.date.datePickerProps}
					/>
				</div>

				<div>
					<DateRangePicker
						label="Event Dates"
						{...fields.range.dateRangePickerProps}
					/>
				</div>

				<div>
					<Select label="Category" {...fields.category.selectProps}>
						<SelectItem id="announcement">Announcement</SelectItem>
						<SelectItem id="blog">Blog</SelectItem>
						<SelectItem id="guide">Guide</SelectItem>
					</Select>
				</div>

				<div>
					<ComboBox
						label="Author"
						allowsCustomValue
						{...fields.author.comboBoxProps}
					>
						<ComboBoxItem id="edmundhung">edmundhung</ComboBoxItem>
						<ComboBoxItem id="chimame">chimame</ComboBoxItem>
					</ComboBox>
				</div>

				<div>
					<FileTrigger label="Profile" {...fields.profile.fileTriggerProps}>
						Upload a profile picture
					</FileTrigger>
				</div>

				<div>
					<Checkbox {...fields.acceptTerms.checkboxProps}>
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
					<Button type="button" onClick={() => intent.reset()}>
						Reset
					</Button>
					<Button type="submit">Submit</Button>
				</footer>
			</form>
		</main>
	);
}
