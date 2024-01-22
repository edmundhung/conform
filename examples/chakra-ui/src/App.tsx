import type { FieldName } from '@conform-to/react';
import {
	FormProvider,
	useForm,
	useField,
	useInputControl,
	parse,
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

type FormError = {
	validity: ValidityState;
	validationMessage: string;
};

export default function Example() {
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate({ formData, form }) {
			return parse(formData, {
				resolve(value) {
					const error: Record<
						string,
						{ validity: ValidityState; validationMessage: string }
					> = {};

					for (const element of Array.from(form.elements)) {
						if (
							(element instanceof HTMLInputElement ||
								element instanceof HTMLSelectElement ||
								element instanceof HTMLTextAreaElement) &&
							element.name !== '' &&
							!element.validity.valid
						) {
							error[element.name] = {
								validity: { ...element.validity },
								validationMessage: element.validationMessage,
							};
						}
					}

					if (Object.entries(error).length > 0) {
						return { error };
					}

					return { value };
				},
			});
		},
	});

	return (
		<Container maxW="container.sm" paddingY={8}>
			<FormProvider context={form.context}>
				<form {...getFormProps(form)}>
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
								{fields.email.errors?.validationMessage}
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
								{fields.language.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.description.valid}>
							<FormLabel>Description (Textarea)</FormLabel>
							<Textarea name={fields.description.name} required />
							<FormErrorMessage>
								{fields.description.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.quantity.valid}>
							<FormLabel>Quantity (NumberInput)</FormLabel>
							<ExampleNumberInput name={fields.quantity.name} />
							<FormErrorMessage>
								{fields.quantity.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.pin.valid}>
							<FormLabel>PIN (PinInput)</FormLabel>
							<ExamplePinInput name={fields.pin.name} />
							<FormErrorMessage>
								{fields.pin.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.title.valid}>
							<FormLabel>Title (Editable)</FormLabel>
							<Editable placeholder="No content">
								<EditablePreview />
								<EditableInput name={fields.title.name} required />
							</Editable>
							<FormErrorMessage>
								{fields.title.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.subscribe.valid}>
							<FormLabel>Subscribe (Checkbox)</FormLabel>
							<Checkbox name={fields.subscribe.name} value="yes" required>
								Newsletter
							</Checkbox>
							<FormErrorMessage>
								{fields.subscribe.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.enabled.valid}>
							<FormLabel>Enabled (Switch)</FormLabel>
							<Switch name={fields.enabled.name} required />
							<FormErrorMessage>
								{fields.enabled.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.progress.valid}>
							<FormLabel>Progress (Slider)</FormLabel>
							<ExampleSlider name={fields.progress.name} />
							<FormErrorMessage>
								{fields.progress.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fields.active.valid}>
							<FormLabel>Active (Radio)</FormLabel>
							<RadioGroup name={fields.active.name}>
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
								{fields.active.errors?.validationMessage}
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

function ExampleNumberInput(props: {
	name: FieldName<number, any, FormError>;
}) {
	const [field] = useField(props.name);
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

function ExamplePinInput(props: { name: FieldName<number, any, FormError> }) {
	const [field] = useField(props.name);
	const control = useInputControl(field);

	return (
		<PinInput
			type="alphanumeric"
			value={control.value ?? ''}
			onChange={control.change}
			isInvalid={!field.valid}
		>
			<PinInputField />
			<PinInputField />
			<PinInputField />
			<PinInputField />
		</PinInput>
	);
}

function ExampleSlider(props: { name: FieldName<number, any, FormError> }) {
	const [field] = useField(props.name);
	const control = useInputControl(field);

	return (
		<Slider
			value={control.value ? Number(control.value) : 0}
			onChange={(number) => control.change(number.toString())}
			onBlur={control.blur}
		>
			<SliderTrack>
				<SliderFilledTrack />
			</SliderTrack>
			<SliderThumb />
		</Slider>
	);
}
