import { getFieldset, isInput, useForm } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { useRef } from 'react';
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

const schema = coerceZodFormData(
	z.object({
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
	}),
);

export default function App() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, initialValue, handleSubmit, intent } = useForm(formRef, {
		onValidate(value) {
			const result = schema.safeParse(value);
			return resolveZodResult(result);
		},
		onSubmit(e, { value }) {
			e.preventDefault();
			alert(JSON.stringify(value, null, 2));
		},
	});
	const fields = getFieldset(initialValue, state);

	return (
		<Container maxW="container.sm" paddingY={8}>
			<form
				ref={formRef}
				onSubmit={(event) => {
					handleSubmit(event);
				}}
				onBlur={(event) => {
					if (
						isInput(event.target) &&
						!state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				onInput={(event) => {
					if (
						isInput(event.target) &&
						state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				noValidate
			>
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
						<FormErrorMessage>{fields.email.error}</FormErrorMessage>
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
						<FormErrorMessage>{fields.language.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.description.valid}>
						<FormLabel>Description (Textarea)</FormLabel>
						<Textarea name={fields.description.name} required />
						<FormErrorMessage>{fields.description.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.quantity.valid}>
						<FormLabel>Quantity (NumberInput)</FormLabel>
						<ExampleNumberInput name={fields.quantity.name} />
						<FormErrorMessage>{fields.quantity.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.pin.valid}>
						<FormLabel>PIN (PinInput)</FormLabel>
						<ExamplePinInput name={fields.pin.name} />
						<FormErrorMessage>{fields.pin.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.title.valid}>
						<FormLabel>Title (Editable)</FormLabel>
						<Editable placeholder="No content">
							<EditablePreview />
							<EditableInput name={fields.title.name} required />
						</Editable>
						<FormErrorMessage>{fields.title.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.subscribe.valid}>
						<FormLabel>Subscribe (Checkbox)</FormLabel>
						<Checkbox name={fields.subscribe.name} value="on" required>
							Newsletter
						</Checkbox>
						<FormErrorMessage>{fields.subscribe.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.enabled.valid}>
						<FormLabel>Enabled (Switch)</FormLabel>
						<Switch name={fields.enabled.name} value="on" required />
						<FormErrorMessage>{fields.enabled.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.progress.valid}>
						<FormLabel>Progress (Slider)</FormLabel>
						<ExampleSlider name={fields.progress.name} />
						<FormErrorMessage>{fields.progress.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={!fields.active.valid}>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup name={fields.active.name}>
							<Stack spacing={5} direction="row">
								<Radio value="yes">Yes</Radio>
								<Radio value="no">No</Radio>
							</Stack>
						</RadioGroup>
						<FormErrorMessage>{fields.active.error}</FormErrorMessage>
					</FormControl>

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
