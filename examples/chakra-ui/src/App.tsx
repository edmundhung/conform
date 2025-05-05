import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	Stack,
	FormControl,
	FormLabel,
	FormErrorMessage,
	Input,
	Select,
	Button,
	Container,
	Editable,
	EditableInput,
	EditablePreview,
	Checkbox,
	RadioGroup,
	Radio,
	Textarea,
	Switch,
	Heading,
	Text,
} from '@chakra-ui/react';
import { ExampleNumberInput, ExamplePinInput, ExampleSlider } from './form';
import { z } from 'zod';

const schema = z.object({
	email: z.string(),
	language: z.string(),
	description: z.string(),
	quantity: z.number(),
	pin: z.string(),
	title: z.string(),
	subscribe: z.boolean(),
	enabled: z.boolean(),
	progress: z.number().min(3).max(7),
	active: z.string(),
});

export default function App() {
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		onSubmit(event, { submission }) {
			event.preventDefault();

			if (submission?.status === 'success') {
				alert(JSON.stringify(submission.value, null, 2));
			}
		},
	});

	return (
		<Container maxW="container.sm" paddingY={8}>
			<form id={form.id} onSubmit={form.onSubmit} noValidate>
				<Stack direction="column" spacing={8}>
					<header>
						<Heading mb={4}>Chakra UI Example</Heading>
						<Text fontSize="xl">
							This shows you how to integrate forms components with Conform.
						</Text>
					</header>

					<FormControl isInvalid={!fields.email.valid}>
						<FormLabel>Email (Input)</FormLabel>
						<Input type="email" name={fields.email.name} required />
						<FormErrorMessage>{fields.email.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.language.valid}>
						<FormLabel>Language (Select)</FormLabel>
						<Select
							name={fields.language.name}
							placeholder="Select option"
							required
						>
							<option value="english">English</option>
							<option value="german">German</option>
							<option value="japanese">Japanese</option>
						</Select>
						<FormErrorMessage>{fields.language.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.description.valid}>
						<FormLabel>Description (Textarea)</FormLabel>
						<Textarea name={fields.description.name} required />
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
						<Editable placeholder="No content">
							<EditablePreview />
							<EditableInput name={fields.title.name} required />
						</Editable>
						<FormErrorMessage>{fields.title.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.subscribe.valid}>
						<FormLabel>Subscribe (Checkbox)</FormLabel>
						<Checkbox name={fields.subscribe.name} value="on" required>
							Newsletter
						</Checkbox>
						<FormErrorMessage>{fields.subscribe.errors}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.enabled.valid}>
						<FormLabel>Enabled (Switch)</FormLabel>
						<Switch name={fields.enabled.name} value="on" required />
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
						<RadioGroup name={fields.active.name}>
							<Stack spacing={5} direction="row">
								<Radio value="yes">Yes</Radio>
								<Radio value="no">No</Radio>
							</Stack>
						</RadioGroup>
						<FormErrorMessage>{fields.active.errors}</FormErrorMessage>
					</FormControl>

					<Stack direction="row" justifyContent="flex-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => form.reset()}
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
