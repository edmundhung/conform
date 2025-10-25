import { useForm } from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import {
	Stack,
	FormControl,
	FormLabel,
	FormErrorMessage,
	Input,
	Select,
	Button,
	Container,
	Checkbox,
	Radio,
	Textarea,
	Switch,
	Heading,
	Text,
} from '@chakra-ui/react';
import {
	ExampleEditable,
	ExampleNumberInput,
	ExamplePinInput,
	ExampleRadioGroup,
	ExampleSlider,
} from './form';
import { z } from 'zod';
import { useState } from 'react';

const schema = coerceFormValue(
	z.object({
		email: z.string(),
		language: z.string(),
		description: z.string(),
		quantity: z.number(),
		pin: z.string().min(4).max(4),
		title: z.string(),
		subscribe: z.boolean(),
		enabled: z.boolean(),
		progress: z.number().min(3).max(7),
		active: z.string(),
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
			language: searchParams.get('language'),
			description: searchParams.get('description'),
			quantity: searchParams.get('quantity'),
			pin: searchParams.get('pin'),
			title: searchParams.get('title'),
			subscribe: searchParams.get('subscribe'),
			enabled: searchParams.get('enabled'),
			progress: searchParams.get('progress'),
			active: searchParams.get('active'),
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
		<Container maxW="container.sm" paddingY={8}>
			<form {...form.props}>
				<Stack direction="column" spacing={8}>
					<header>
						<Heading mb={4}>Chakra UI Example</Heading>
						<Text>
							This example shows you how to integrate Chakra UI with Conform.
							When the form is submitted, the search params will be updated with
							the form data and is set as the default value of the form.
						</Text>
					</header>

					<FormControl isInvalid={!fields.email.valid}>
						<FormLabel>Email (Input)</FormLabel>
						<Input
							type="email"
							name={fields.email.name}
							defaultValue={fields.email.defaultValue}
						/>
						<FormErrorMessage>{fields.email.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.language.valid}>
						<FormLabel>Language (Select)</FormLabel>
						<Select
							name={fields.language.name}
							defaultValue={fields.language.defaultValue}
							placeholder="Select option"
						>
							<option value="english">English</option>
							<option value="german">German</option>
							<option value="japanese">Japanese</option>
						</Select>
						<FormErrorMessage>{fields.language.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.description.valid}>
						<FormLabel>Description (Textarea)</FormLabel>
						<Textarea
							name={fields.description.name}
							defaultValue={fields.description.defaultValue}
						/>
						<FormErrorMessage>{fields.description.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.quantity.valid}>
						<FormLabel>Quantity (NumberInput)</FormLabel>
						<ExampleNumberInput
							name={fields.quantity.name}
							defaultValue={fields.quantity.defaultValue}
						/>
						<FormErrorMessage>{fields.quantity.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.pin.valid}>
						<FormLabel>PIN (PinInput)</FormLabel>
						<ExamplePinInput
							name={fields.pin.name}
							defaultValue={fields.pin.defaultValue}
						/>
						<FormErrorMessage>{fields.pin.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.title.valid}>
						<FormLabel>Title (Editable)</FormLabel>
						<ExampleEditable
							name={fields.title.name}
							defaultValue={fields.title.defaultValue}
						/>
						<FormErrorMessage>{fields.title.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.subscribe.valid}>
						<FormLabel>Subscribe (Checkbox)</FormLabel>
						<Checkbox
							name={fields.subscribe.name}
							value="on"
							defaultChecked={fields.subscribe.defaultChecked}
						>
							Newsletter
						</Checkbox>
						<FormErrorMessage>{fields.subscribe.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.enabled.valid}>
						<FormLabel>Enabled (Switch)</FormLabel>
						<Switch
							name={fields.enabled.name}
							value="on"
							defaultChecked={fields.enabled.defaultChecked}
						/>
						<FormErrorMessage>{fields.enabled.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.progress.valid}>
						<FormLabel>Progress (Slider)</FormLabel>
						<ExampleSlider
							name={fields.progress.name}
							defaultValue={fields.progress.defaultValue}
						/>
						<FormErrorMessage>{fields.progress.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.active.valid}>
						<FormLabel>Active (Radio)</FormLabel>
						<ExampleRadioGroup
							name={fields.active.name}
							defaultValue={fields.active.defaultValue}
						>
							<Stack spacing={5} direction="row">
								<Radio value="yes">Yes</Radio>
								<Radio value="no">No</Radio>
							</Stack>
						</ExampleRadioGroup>
						<FormErrorMessage>{fields.active.errors}</FormErrorMessage>
					</FormControl>

					{submittedValue ? (
						<div>
							<Text mb={2}>Value submitted</Text>
							<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
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
						<Button type="submit" variant="solid">
							Submit
						</Button>
					</Stack>
				</Stack>
			</form>
		</Container>
	);
}
