import type { FieldName } from '@conform-to/react';
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

type FormError = {
	validity: ValidityState;
	validationMessage: string;
};

export default function Example() {
	const { form, fieldset } = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate(context) {
			return validateConstraint(context);
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

						<FormControl isInvalid={!fieldset.email.valid}>
							<FormLabel>Email (Input)</FormLabel>
							<Input type="email" name={fieldset.email.name} required />
							<FormErrorMessage>
								{fieldset.email.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.language.valid}>
							<FormLabel>Language (Select)</FormLabel>
							<Select
								name={fieldset.language.name}
								placeholder="Select option"
								required
							>
								<option value="english">English</option>
								<option value="deutsche">Deutsch</option>
								<option value="japanese">Japanese</option>
							</Select>
							<FormErrorMessage>
								{fieldset.language.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.description.valid}>
							<FormLabel>Description (Textarea)</FormLabel>
							<Textarea name={fieldset.description.name} required />
							<FormErrorMessage>
								{fieldset.description.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.quantity.valid}>
							<FormLabel>Quantity (NumberInput)</FormLabel>
							<ExampleNumberInput name={fieldset.quantity.name} />
							<FormErrorMessage>
								{fieldset.quantity.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.pin.valid}>
							<FormLabel>PIN (PinInput)</FormLabel>
							<ExamplePinInput name={fieldset.pin.name} />
							<FormErrorMessage>
								{fieldset.pin.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.title.valid}>
							<FormLabel>Title (Editable)</FormLabel>
							<Editable placeholder="No content">
								<EditablePreview />
								<EditableInput name={fieldset.title.name} required />
							</Editable>
							<FormErrorMessage>
								{fieldset.title.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.subscribe.valid}>
							<FormLabel>Subscribe (Checkbox)</FormLabel>
							<Checkbox name={fieldset.subscribe.name} value="yes" required>
								Newsletter
							</Checkbox>
							<FormErrorMessage>
								{fieldset.subscribe.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.enabled.valid}>
							<FormLabel>Enabled (Switch)</FormLabel>
							<Switch name={fieldset.enabled.name} required />
							<FormErrorMessage>
								{fieldset.enabled.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.progress.valid}>
							<FormLabel>Progress (Slider)</FormLabel>
							<ExampleSlider name={fieldset.progress.name} />
							<FormErrorMessage>
								{fieldset.progress.errors?.validationMessage}
							</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!fieldset.active.valid}>
							<FormLabel>Active (Radio)</FormLabel>
							<RadioGroup name={fieldset.active.name}>
								<Stack spacing={5} direction="row">
									<Radio
										value="yes"
										isRequired={fieldset.active.constraint?.required ?? true}
									>
										Yes
									</Radio>
									<Radio
										value="no"
										isRequired={fieldset.active.constraint?.required ?? true}
									>
										No
									</Radio>
								</Stack>
							</RadioGroup>
							<FormErrorMessage>
								{fieldset.active.errors?.validationMessage}
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

function ExampleNumberInput(props: { name: FieldName<number, FormError> }) {
	const { field } = useField(props);
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

function ExamplePinInput(props: { name: FieldName<number, FormError> }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const { field } = useField(props);
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

function ExampleSlider(props: { name: FieldName<number, FormError> }) {
	const { field } = useField(props);
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
