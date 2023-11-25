import type { FieldProps } from '@conform-to/react';
import {
	useForm,
	useInputControl,
	conform,
	validateConstraint,
	useField,
	FormProvider,
} from '@conform-to/react';
import {
	Stack,
	FormControl,
	FormLabel,
	FormErrorMessage,
	Input,
	Select,
	Button,
	Container,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	PinInput,
	PinInputField,
	Editable,
	EditableInput,
	EditablePreview,
	Checkbox,
	RadioGroup,
	Radio,
	Textarea,
	Switch,
	Slider,
	SliderTrack,
	SliderFilledTrack,
	SliderThumb,
	Heading,
	Text,
} from '@chakra-ui/react';
import { useRef } from 'react';

interface Schema {
	email: string;
	language: string;
	description: string;
	quantity: number;
	pin: string;
	title: string;
	progress: number;
	ranges: number[];
	subscribe: boolean;
	enabled: boolean;
	active: boolean;
}

export default function Example() {
	const form = useForm<Schema>({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate(context) {
			return validateConstraint(context);
		},
	});

	return (
		<Container maxW="container.sm" paddingY={8}>
			<FormProvider context={form.context}>
				<form {...conform.form(form)}>
					<Stack direction="column" spacing={8}>
						<header>
							<Heading mb={4}>Chakra UI Example</Heading>
							<Text fontSize="xl">
								This shows you how to integrate forms components with Conform.
							</Text>
						</header>

						<FormControl isInvalid={!form.fields.email.valid}>
							<FormLabel>Email (Input)</FormLabel>
							<Input type="email" name={form.fields.email.name} required />
							<FormErrorMessage>
								{form.fields.email.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.language.valid}>
							<FormLabel>Language (Select)</FormLabel>
							<Select
								name={form.fields.language.name}
								placeholder="Select option"
								required
							>
								<option value="english">English</option>
								<option value="deutsche">Deutsch</option>
								<option value="japanese">Japanese</option>
							</Select>
							<FormErrorMessage>
								{form.fields.language.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.description.valid}>
							<FormLabel>Description (Textarea)</FormLabel>
							<Textarea name={form.fields.description.name} required />
							<FormErrorMessage>
								{form.fields.description.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.quantity.valid}>
							<FormLabel>Quantity (NumberInput)</FormLabel>
							<ExampleNumberInput
								name={form.fields.quantity.name}
								formId={form.id}
							/>
							<FormErrorMessage>
								{form.fields.quantity.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.pin.valid}>
							<FormLabel>PIN (PinInput)</FormLabel>
							<ExamplePinInput name={form.fields.pin.name} formId={form.id} />
							<FormErrorMessage>
								{form.fields.pin.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.title.valid}>
							<FormLabel>Title (Editable)</FormLabel>
							<Editable
								defaultValue={form.fields.title.initialValue}
								placeholder="No content"
							>
								<EditablePreview />
								<EditableInput name={form.fields.title.name} required />
							</Editable>
							<FormErrorMessage>
								{form.fields.title.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.subscribe.valid}>
							<FormLabel>Subscribe (Checkbox)</FormLabel>
							<Checkbox name={form.fields.subscribe.name} value="yes" required>
								Newsletter
							</Checkbox>
							<FormErrorMessage>
								{form.fields.subscribe.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.enabled.valid}>
							<FormLabel>Enabled (Switch)</FormLabel>
							<Switch name={form.fields.enabled.name} required />
							<FormErrorMessage>
								{form.fields.enabled.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.progress.valid}>
							<FormLabel>Progress (Slider)</FormLabel>
							<ExampleSlider
								name={form.fields.progress.name}
								formId={form.id}
							/>
							<FormErrorMessage>
								{form.fields.progress.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!form.fields.active.valid}>
							<FormLabel>Active (Radio)</FormLabel>
							<RadioGroup
								name={form.fields.active.name}
								defaultValue={
									typeof form.fields.active.initialValue === 'boolean'
										? form.fields.active.initialValue
											? 'on'
											: ''
										: form.fields.active.initialValue
								}
							>
								<Stack spacing={5} direction="row">
									<Radio
										value="yes"
										isRequired={form.fields.active.constraint?.required ?? true}
									>
										Yes
									</Radio>
									<Radio
										value="no"
										isRequired={form.fields.active.constraint?.required ?? true}
									>
										No
									</Radio>
								</Stack>
							</RadioGroup>
							<FormErrorMessage>
								{form.fields.active.errors?.join(', ')}
							</FormErrorMessage>
						</FormControl>

						<Stack direction="row" justifyContent="flex-end">
							<Button type="reset" variant="outline">
								Reset
							</Button>
							<Button type="submit" variant="solid">
								Submit
							</Button>
						</Stack>
					</Stack>
				</form>
			</FormProvider>
		</Container>
	);
}

function ExampleNumberInput(props: FieldProps<number>) {
	const field = useField(props);
	const control = useInputControl(field);

	return (
		<NumberInput
			isRequired
			name={field.name}
			value={control.value ?? ''}
			onChange={control.change}
		>
			<NumberInputField />
			<NumberInputStepper>
				<NumberIncrementStepper />
				<NumberDecrementStepper />
			</NumberInputStepper>
		</NumberInput>
	);
}

function ExamplePinInput(config: FieldProps<string>) {
	const inputRef = useRef<HTMLInputElement>(null);
	const field = useField(config);
	const control = useInputControl(field);

	return (
		<PinInput
			type="alphanumeric"
			value={control.value ?? ''}
			onChange={control.change}
			isInvalid={!field.valid}
		>
			<PinInputField ref={inputRef} />
			<PinInputField />
			<PinInputField />
			<PinInputField />
		</PinInput>
	);
}

function ExampleSlider(config: FieldProps<number>) {
	const field = useField(config);
	const control = useInputControl(field, {
		initialize(value) {
			return typeof value !== 'undefined' ? Number(value) : undefined;
		},
	});

	return (
		<Slider
			value={control.value}
			onChange={control.change}
			onBlur={control.blur}
		>
			<SliderTrack>
				<SliderFilledTrack />
			</SliderTrack>
			<SliderThumb />
		</Slider>
	);
}
