import type { FieldProps } from '@conform-to/react';
import {
	FormProvider,
	useForm,
	useField,
	useInputControl,
	validateConstraint,
	getFormProps,
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

type Error = {
	validity: ValidityState;
	validationMessage: string;
};

export default function Example() {
	const { meta, fields } = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate(context) {
			return validateConstraint(context);
		},
	});

	return (
		<Container maxW="container.sm" paddingY={8}>
			<FormProvider context={meta.context}>
				<form {...getFormProps(meta)}>
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
							<FormErrorMessage>
								{fields.email.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.language.valid}>
							<FormLabel>Language (Select)</FormLabel>
							<Select
								name={fields.language.name}
								placeholder="Select option"
								required
							>
								<option value="english">English</option>
								<option value="deutsche">Deutsch</option>
								<option value="japanese">Japanese</option>
							</Select>
							<FormErrorMessage>
								{fields.language.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.description.valid}>
							<FormLabel>Description (Textarea)</FormLabel>
							<Textarea name={fields.description.name} required />
							<FormErrorMessage>
								{fields.description.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.quantity.valid}>
							<FormLabel>Quantity (NumberInput)</FormLabel>
							<ExampleNumberInput
								name={fields.quantity.name}
								formId={meta.id}
							/>
							<FormErrorMessage>
								{fields.quantity.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.pin.valid}>
							<FormLabel>PIN (PinInput)</FormLabel>
							<ExamplePinInput name={fields.pin.name} formId={meta.id} />
							<FormErrorMessage>
								{fields.pin.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.title.valid}>
							<FormLabel>Title (Editable)</FormLabel>
							<Editable
								defaultValue={fields.title.initialValue}
								placeholder="No content"
							>
								<EditablePreview />
								<EditableInput name={fields.title.name} required />
							</Editable>
							<FormErrorMessage>
								{fields.title.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.subscribe.valid}>
							<FormLabel>Subscribe (Checkbox)</FormLabel>
							<Checkbox name={fields.subscribe.name} value="yes" required>
								Newsletter
							</Checkbox>
							<FormErrorMessage>
								{fields.subscribe.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.enabled.valid}>
							<FormLabel>Enabled (Switch)</FormLabel>
							<Switch name={fields.enabled.name} required />
							<FormErrorMessage>
								{fields.enabled.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.progress.valid}>
							<FormLabel>Progress (Slider)</FormLabel>
							<ExampleSlider name={fields.progress.name} formId={meta.id} />
							<FormErrorMessage>
								{fields.progress.error?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.active.valid}>
							<FormLabel>Active (Radio)</FormLabel>
							<RadioGroup
								name={fields.active.name}
								defaultValue={fields.active.initialValue}
							>
								<Stack spacing={5} direction="row">
									<Radio
										value="yes"
										isRequired={fields.active.constraint?.required ?? true}
									>
										Yes
									</Radio>
									<Radio
										value="no"
										isRequired={fields.active.constraint?.required ?? true}
									>
										No
									</Radio>
								</Stack>
							</RadioGroup>
							<FormErrorMessage>
								{fields.active.error?.validationMessage}
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

function ExampleNumberInput(props: FieldProps<number, Error>) {
	const { meta } = useField(props);
	const control = useInputControl(meta);

	return (
		<NumberInput
			isRequired
			name={meta.name}
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

function ExamplePinInput(config: FieldProps<string, Error>) {
	const inputRef = useRef<HTMLInputElement>(null);
	const { meta } = useField(config);
	const control = useInputControl(meta);

	return (
		<PinInput
			type="alphanumeric"
			value={control.value ?? ''}
			onChange={control.change}
			isInvalid={!meta.valid}
		>
			<PinInputField ref={inputRef} />
			<PinInputField />
			<PinInputField />
			<PinInputField />
		</PinInput>
	);
}

function ExampleSlider(config: FieldProps<number, Error>) {
	const { meta } = useField(config);
	const control = useInputControl(meta, {
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
