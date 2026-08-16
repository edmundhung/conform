import { coerceFormValue } from '@conform-to/zod/v4/future';
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
import {
	ComboBox,
	ComboBoxItem,
	MultiSelectComboBox,
} from './components/ComboBox';
import { FileTrigger } from './components/FileTrigger';
import { Switch } from './components/Switch';
import { useForm } from './forms';

const languageSchema = z.enum(['en', 'de', 'ja'], {
	error: 'Choose a supported language',
});
const colorSchema = z.enum(['red', 'green', 'blue']);
const topicSchema = z.enum(['accessibility', 'forms', 'validation']);

const schema = coerceFormValue(
	z.object({
		email: z.string({ error: 'Email is required' }),
		price: z.number({ error: 'Price is required' }),
		language: languageSchema,
		colors: colorSchema.array().min(1, 'Choose at least one color'),
		date: z.date({ error: 'Publish date is required' }),
		range: z.object({
			start: z.string({ error: 'Event dates are required' }),
			end: z.string({ error: 'Event dates are required' }),
		}),
		category: z.string({ error: 'Category is required' }),
		author: z.string({ error: 'Author is required' }),
		topics: topicSchema.array().min(1, 'Choose at least one topic'),
		profile: z
			.instanceof(File, { error: 'Profile picture is required' })
			.refine((file) => file.name !== '', 'Profile picture is required'),
		notifications: z.boolean({ error: 'Choose whether to get notifications' }),
		acceptTerms: z.boolean({ error: 'Accept the terms to continue' }),
	}),
);

function stringifySubmittedValue(value: z.output<typeof schema>) {
	return JSON.stringify(
		value,
		(_key, item) =>
			item instanceof File
				? { name: item.name, size: item.size, type: item.type }
				: item,
		2,
	);
}

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [submittedFormData, setSubmittedFormData] = useState<Array<
		[string, string]
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
			const searchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(searchParams);
			setSubmittedFormData(
				Array.from(formData, ([name, value]) => [
					name,
					typeof value === 'string' ? value : value.name,
				]),
			);
			setSubmittedValue(value);
		},
	});

	return (
		<main>
			<form
				{...form.props}
				onChange={() => {
					setSubmittedValue(null);
					setSubmittedFormData(null);
				}}
			>
				<div>
					<h3>React Aria Components Example</h3>
					<p>
						This shows how Conform integrates with current React Aria
						Components, including multi-select ComboBox, Switch, and
						FileTrigger.
					</p>
				</div>

				<div>
					<TextField
						label="Email"
						type="email"
						{...fields.email.textFieldProps}
						// Equivalent to:
						// name={fields.email.name}
						// defaultValue={fields.email.defaultValue}
						// isRequired={fields.email.required}
						// isInvalid={!fields.email.valid}
						// errors={fields.email.errors}
					/>
				</div>

				<div>
					<NumberField
						label="Price"
						{...fields.price.numberFieldProps}
						// Equivalent to:
						// name={fields.price.name}
						// defaultValue={fields.price.defaultValue}
						// isRequired={fields.price.required}
						// isInvalid={!fields.price.valid}
						// errors={fields.price.errors}
					/>
				</div>

				<div>
					<RadioGroup
						label="Language"
						description="Choose the language used for generated content."
						{...fields.language.radioGroupProps}
						// Equivalent to:
						// name={fields.language.name}
						// defaultValue={fields.language.defaultValue}
						// isRequired={fields.language.required}
						// isInvalid={!fields.language.valid}
						// errors={fields.language.errors}
					>
						<Radio value="en" description="English content and messages">
							English
						</Radio>
						<Radio value="de" description="German content and messages">
							German
						</Radio>
						<Radio value="ja" description="Japanese content and messages">
							Japanese
						</Radio>
						<Radio value="invalid">Invalid</Radio>
					</RadioGroup>
				</div>

				<div>
					<CheckboxGroup
						label="Colors"
						{...fields.colors.checkboxGroupProps}
						// Equivalent to:
						// name={fields.colors.name}
						// defaultValue={fields.colors.defaultOptions}
						// isRequired={fields.colors.required}
						// isInvalid={!fields.colors.valid}
						// errors={fields.colors.errors}
					>
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
						// Equivalent to:
						// name={fields.date.name}
						// defaultValue={fields.date.defaultValue}
						// isRequired={fields.date.required}
						// isInvalid={!fields.date.valid}
						// errors={fields.date.errors}
					/>
				</div>

				<div>
					<DateRangePicker
						label="Event Dates"
						{...fields.range.dateRangePickerProps}
						// Equivalent to:
						// startName={fields.range.getFieldset().start.name}
						// endName={fields.range.getFieldset().end.name}
						// defaultValue={{
						//   start: fields.range.getFieldset().start.defaultValue,
						//   end: fields.range.getFieldset().end.defaultValue,
						// }}
						// isRequired={fields.range.required}
						// isInvalid={!fields.range.valid}
						// errors={fields.range.getFieldset().start.errors ?? fields.range.getFieldset().end.errors}
					/>
				</div>

				<div>
					<Select
						label="Category"
						{...fields.category.selectProps}
						// Equivalent to:
						// name={fields.category.name}
						// defaultValue={fields.category.defaultValue}
						// isRequired={fields.category.required}
						// isInvalid={!fields.category.valid}
						// errors={fields.category.errors}
					>
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
						// Equivalent to:
						// name={fields.author.name}
						// defaultValue={fields.author.defaultValue}
						// isRequired={fields.author.required}
						// isInvalid={!fields.author.valid}
						// errors={fields.author.errors}
					>
						<ComboBoxItem id="edmundhung">edmundhung</ComboBoxItem>
						<ComboBoxItem id="chimame">chimame</ComboBoxItem>
					</ComboBox>
				</div>

				<div>
					<MultiSelectComboBox
						label="Topics"
						description="Select one or more topics. Each value is submitted with the same field name."
						{...fields.topics.multiSelectComboBoxProps}
						// Equivalent to:
						// name={fields.topics.name}
						// defaultValue={fields.topics.defaultOptions}
						// isRequired={fields.topics.required}
						// isInvalid={!fields.topics.valid}
						// errors={fields.topics.errors}
					>
						<ComboBoxItem id="accessibility">Accessibility</ComboBoxItem>
						<ComboBoxItem id="forms">Forms</ComboBoxItem>
						<ComboBoxItem id="validation">Validation</ComboBoxItem>
					</MultiSelectComboBox>
				</div>

				<div>
					<FileTrigger
						label="Profile"
						{...fields.profile.fileTriggerProps}
						// Equivalent to:
						// name={fields.profile.name}
						// isRequired={fields.profile.required}
						// isInvalid={!fields.profile.valid}
						// errors={fields.profile.errors}
					>
						Upload a profile picture
					</FileTrigger>
				</div>

				<div>
					<Switch
						description="Receive an email when the submission is processed."
						{...fields.notifications.switchProps}
						// Equivalent to:
						// name={fields.notifications.name}
						// defaultSelected={fields.notifications.defaultValue === 'on'}
						// isRequired={fields.notifications.required}
						// isInvalid={!fields.notifications.valid}
						// errors={fields.notifications.errors}
					>
						Email notifications
					</Switch>
				</div>

				<div>
					<Checkbox
						description="Required before this form can be submitted."
						{...fields.acceptTerms.checkboxProps}
						// Equivalent to:
						// name={fields.acceptTerms.name}
						// defaultSelected={fields.acceptTerms.defaultValue === 'on'}
						// isRequired={fields.acceptTerms.required}
						// isInvalid={!fields.acceptTerms.valid}
						// errors={fields.acceptTerms.errors}
					>
						Accept Terms and Conditions
					</Checkbox>
				</div>

				{submittedValue ? (
					<div>
						<h4>Value submitted</h4>
						<pre data-testid="submitted-value">
							{stringifySubmittedValue(submittedValue)}
						</pre>
						<h4>FormData submitted</h4>
						<pre data-testid="submitted-form-data">
							{JSON.stringify(submittedFormData, null, 2)}
						</pre>
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
