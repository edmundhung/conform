import { coerceFormValue } from '@conform-to/zod/v4/future';
import {
	Button,
	Container,
	Field,
	Fieldset,
	Heading,
	Input,
	NativeSelect,
	RadioGroup,
	Stack,
	Text,
	Textarea,
} from '@chakra-ui/react';
import { z } from 'zod';
import { useState } from 'react';
import {
	ExampleCheckbox,
	ExampleEditable,
	ExampleFileUpload,
	ExampleNumberInput,
	ExamplePinInput,
	ExampleRadioGroup,
	ExampleSlider,
	ExampleSwitch,
	ExampleTagsInput,
} from './form';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		email: z
			.string({ error: 'Email is required' })
			.email('Enter a valid email address'),
		language: z.enum(['english', 'german', 'japanese'], {
			error: 'Choose a language',
		}),
		description: z.string({ error: 'Description is required' }).min(1),
		quantity: z.number({ error: 'Quantity is required' }).min(1),
		pin: z
			.string({ error: 'PIN is required' })
			.length(4, 'PIN must contain 4 characters'),
		title: z.string({ error: 'Title is required' }).min(1),
		subscribe: z.literal(true, { error: 'Newsletter consent is required' }),
		enabled: z.literal(true, { error: 'Enable this setting' }),
		progress: z.number({ error: 'Progress is required' }).min(3).max(7),
		active: z.enum(['yes', 'no'], { error: 'Choose an active state' }),
		tags: z
			.array(z.string(), { error: 'Add at least one topic' })
			.min(1, 'Add at least one topic'),
		attachment: z.file({ error: 'Choose a file' }),
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
					// Skip files because they cannot be represented in URL search params.
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
		<Container maxW="2xl" py={8}>
			<form {...form.props} onChange={() => setSubmittedValue(null)}>
				<Stack gap={8}>
					<header>
						<Heading mb={4}>Chakra UI Example</Heading>
						<Text>
							This example shows how to integrate Chakra UI with Conform. When
							the form is submitted, serializable form data is written to the
							URL and becomes the form&apos;s new default value.
						</Text>
					</header>

					<Field.Root invalid={!fields.email.valid} required>
						<Field.Label htmlFor={fields.email.id}>Email (Input)</Field.Label>
						<Input
							type="email"
							{...fields.email.inputProps}
							// Equivalent to:
							// id={fields.email.id}
							// name={fields.email.name}
							// defaultValue={fields.email.defaultValue}
							// required={fields.email.required}
							// aria-invalid={fields.email.ariaInvalid}
							// aria-describedby={fields.email.ariaDescribedBy}
						/>
						<Field.ErrorText id={fields.email.errorId}>
							{fields.email.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.language.valid} required>
						<Field.Label htmlFor={fields.language.id}>
							Language (NativeSelect)
						</Field.Label>
						<NativeSelect.Root invalid={!fields.language.valid}>
							<NativeSelect.Field
								placeholder="Select option"
								{...fields.language.selectProps}
								// Equivalent to:
								// id={fields.language.id}
								// name={fields.language.name}
								// defaultValue={fields.language.defaultValue}
								// aria-invalid={fields.language.ariaInvalid}
								// aria-describedby={fields.language.ariaDescribedBy}
							>
								<option value="english">English</option>
								<option value="german">German</option>
								<option value="japanese">Japanese</option>
							</NativeSelect.Field>
							<NativeSelect.Indicator />
						</NativeSelect.Root>
						<Field.ErrorText id={fields.language.errorId}>
							{fields.language.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.description.valid} required>
						<Field.Label htmlFor={fields.description.id}>
							Description (Textarea)
						</Field.Label>
						<Textarea
							{...fields.description.textareaProps}
							// Equivalent to:
							// id={fields.description.id}
							// name={fields.description.name}
							// defaultValue={fields.description.defaultValue}
							// required={fields.description.required}
							// aria-invalid={fields.description.ariaInvalid}
							// aria-describedby={fields.description.ariaDescribedBy}
						/>
						<Field.ErrorText id={fields.description.errorId}>
							{fields.description.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.quantity.valid} required>
						<Field.Label htmlFor={fields.quantity.id}>
							Quantity (NumberInput)
						</Field.Label>
						<ExampleNumberInput
							{...fields.quantity.numberInputProps}
							// Equivalent to:
							// id={fields.quantity.id}
							// name={fields.quantity.name}
							// defaultValue={fields.quantity.defaultValue}
							// required={fields.quantity.required}
							// invalid={!fields.quantity.valid}
							// aria-describedby={fields.quantity.ariaDescribedBy}
						/>
						<Field.ErrorText id={fields.quantity.errorId}>
							{fields.quantity.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.pin.valid} required>
						<Field.Label htmlFor={fields.pin.id}>PIN (PinInput)</Field.Label>
						<ExamplePinInput
							{...fields.pin.pinInputProps}
							// Equivalent to:
							// id={fields.pin.id}
							// name={fields.pin.name}
							// defaultValue={fields.pin.defaultValue}
							// required={fields.pin.required}
							// invalid={!fields.pin.valid}
							// aria-describedby={fields.pin.ariaDescribedBy}
						/>
						<Field.ErrorText id={fields.pin.errorId}>
							{fields.pin.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.title.valid} required>
						<Field.Label htmlFor={fields.title.id}>
							Title (Editable)
						</Field.Label>
						<ExampleEditable
							{...fields.title.editableProps}
							// Equivalent to:
							// id={fields.title.id}
							// name={fields.title.name}
							// defaultValue={fields.title.defaultValue}
							// required={fields.title.required}
							// invalid={!fields.title.valid}
							// aria-describedby={fields.title.ariaDescribedBy}
						/>
						<Field.ErrorText id={fields.title.errorId}>
							{fields.title.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.subscribe.valid} required>
						<Field.Label htmlFor={fields.subscribe.id}>
							Subscribe (Checkbox)
						</Field.Label>
						<ExampleCheckbox
							{...fields.subscribe.checkboxProps}
							// Equivalent to:
							// id={fields.subscribe.id}
							// name={fields.subscribe.name}
							// value="on"
							// defaultChecked={fields.subscribe.defaultChecked}
							// required={fields.subscribe.required}
							// invalid={!fields.subscribe.valid}
							// aria-describedby={fields.subscribe.ariaDescribedBy}
						>
							Newsletter
						</ExampleCheckbox>
						<Field.ErrorText id={fields.subscribe.errorId}>
							{fields.subscribe.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.enabled.valid} required>
						<Field.Label htmlFor={fields.enabled.id}>
							Enabled (Switch)
						</Field.Label>
						<ExampleSwitch
							{...fields.enabled.switchProps}
							// Equivalent to:
							// id={fields.enabled.id}
							// name={fields.enabled.name}
							// value="on"
							// defaultChecked={fields.enabled.defaultChecked}
							// required={fields.enabled.required}
							// invalid={!fields.enabled.valid}
							// aria-describedby={fields.enabled.ariaDescribedBy}
						>
							On
						</ExampleSwitch>
						<Field.ErrorText id={fields.enabled.errorId}>
							{fields.enabled.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.progress.valid} required>
						<Field.Label
							id={`${fields.progress.id}-label`}
							htmlFor={fields.progress.id}
						>
							Progress (Slider)
						</Field.Label>
						<ExampleSlider
							{...fields.progress.sliderProps}
							// Equivalent to:
							// id={fields.progress.id}
							// name={fields.progress.name}
							// defaultValue={fields.progress.defaultValue}
							// required={fields.progress.required}
							// invalid={!fields.progress.valid}
							// aria-describedby={fields.progress.ariaDescribedBy}
							// aria-labelledby={`${fields.progress.id}-label`}
						/>
						<Field.ErrorText id={fields.progress.errorId}>
							{fields.progress.errors}
						</Field.ErrorText>
					</Field.Root>

					<Fieldset.Root invalid={!fields.active.valid}>
						<Fieldset.Legend id={`${fields.active.id}-legend`}>
							Active (RadioGroup)
						</Fieldset.Legend>
						<ExampleRadioGroup
							{...fields.active.radioGroupProps}
							aria-labelledby={`${fields.active.id}-legend`}
							// Equivalent to:
							// id={fields.active.id}
							// name={fields.active.name}
							// defaultValue={fields.active.defaultValue}
							// required={fields.active.required}
							// invalid={!fields.active.valid}
							// aria-describedby={fields.active.ariaDescribedBy}
						>
							<Stack gap={5} direction="row">
								<RadioGroup.Item value="yes">
									{/* BaseControl is the only named field. */}
									<RadioGroup.ItemHiddenInput name="" />
									<RadioGroup.ItemIndicator />
									<RadioGroup.ItemText>Yes</RadioGroup.ItemText>
								</RadioGroup.Item>
								<RadioGroup.Item value="no">
									<RadioGroup.ItemHiddenInput name="" />
									<RadioGroup.ItemIndicator />
									<RadioGroup.ItemText>No</RadioGroup.ItemText>
								</RadioGroup.Item>
							</Stack>
						</ExampleRadioGroup>
						<Fieldset.ErrorText id={fields.active.errorId}>
							{fields.active.errors}
						</Fieldset.ErrorText>
					</Fieldset.Root>

					<Field.Root invalid={!fields.tags.valid} required>
						<Field.Label htmlFor={fields.tags.id}>
							Topics (TagsInput)
						</Field.Label>
						<ExampleTagsInput
							{...fields.tags.tagsInputProps}
							// Equivalent to:
							// id={fields.tags.id}
							// name={fields.tags.name}
							// defaultValue={fields.tags.defaultOptions}
							// required={fields.tags.required}
							// invalid={!fields.tags.valid}
							// aria-describedby={fields.tags.ariaDescribedBy}
						/>
						<Field.ErrorText id={fields.tags.errorId}>
							{fields.tags.errors}
						</Field.ErrorText>
					</Field.Root>

					<Field.Root invalid={!fields.attachment.valid} required>
						<Field.Label
							id={`${fields.attachment.id}-label`}
							htmlFor={fields.attachment.id}
						>
							Attachment (FileUpload, required)
						</Field.Label>
						<ExampleFileUpload
							{...fields.attachment.fileUploadProps}
							// Equivalent to:
							// id={fields.attachment.id}
							// name={fields.attachment.name}
							// required={fields.attachment.required}
							// invalid={!fields.attachment.valid}
							// aria-describedby={fields.attachment.ariaDescribedBy}
							// aria-labelledby={`${fields.attachment.id}-label ${fields.attachment.id}`}
						/>
						<Field.ErrorText id={fields.attachment.errorId}>
							{fields.attachment.errors}
						</Field.ErrorText>
					</Field.Root>

					{submittedValue ? (
						<div>
							<Text mb={2}>Value submitted</Text>
							<pre>{stringifySubmittedValue(submittedValue)}</pre>
						</div>
					) : null}

					<Stack direction="row" justifyContent="flex-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => intent.reset()}
						>
							Reset
						</Button>
						<Button type="submit">Submit</Button>
					</Stack>
				</Stack>
			</form>
		</Container>
	);
}
