import type { FieldConfig } from '@conform-to/react';
import { useForm, useInputEvent, conform } from '@conform-to/react';
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
import { useRef, useState } from 'react';

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
	const [form, fieldset] = useForm<Schema>();

	return (
		<Container maxW="container.sm" paddingY={8}>
			<form {...form.props}>
				<Stack direction="column" spacing={8}>
					<header>
						<Heading mb={4}>Chakra UI Example</Heading>
						<Text fontSize="xl">
							This shows you how to integrate forms components with Conform.
						</Text>
					</header>

					<FormControl isInvalid={Boolean(fieldset.email.error)}>
						<FormLabel>Email (Input)</FormLabel>
						<Input type="email" name={fieldset.email.config.name} required />
						<FormErrorMessage>{fieldset.email.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.language.error)}>
						<FormLabel>Language (Select)</FormLabel>
						<Select
							name={fieldset.language.config.name}
							placeholder="Select option"
							required
						>
							<option value="english">English</option>
							<option value="deutsche">Deutsch</option>
							<option value="japanese">Japanese</option>
						</Select>
						<FormErrorMessage>{fieldset.language.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.description.error)}>
						<FormLabel>Description (Textarea)</FormLabel>
						<Textarea name={fieldset.description.config.name} required />
						<FormErrorMessage>{fieldset.description.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.quantity.error)}>
						<FormLabel>Quantity (NumberInput)</FormLabel>
						<ExampleNumberInput
							name={fieldset.quantity.config.name}
							required
							min={1}
							max={10}
							step={1}
						/>
						<FormErrorMessage>{fieldset.quantity.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.pin.error)}>
						<FormLabel>PIN (PinInput)</FormLabel>
						<ExamplePinInput
							name={fieldset.pin.config.name}
							isInvalid={Boolean(fieldset.pin.error)}
							required
							pattern="[0-9]{4}"
						/>
						<FormErrorMessage>{fieldset.pin.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.title.error)}>
						<FormLabel>Title (Editable)</FormLabel>
						<Editable
							defaultValue={fieldset.title.config.defaultValue}
							placeholder="No content"
						>
							<EditablePreview />
							<EditableInput name={fieldset.title.config.name} required />
						</Editable>
						<FormErrorMessage>{fieldset.title.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.subscribe.error)}>
						<FormLabel>Subscribe (Checkbox)</FormLabel>
						<Checkbox
							name={fieldset.subscribe.config.name}
							value="yes"
							required
						>
							Newsletter
						</Checkbox>
						<FormErrorMessage>{fieldset.subscribe.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.enabled.error)}>
						<FormLabel>Enabled (Switch)</FormLabel>
						<Switch name={fieldset.enabled.config.name} required />
						<FormErrorMessage>{fieldset.enabled.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.progress.error)}>
						<FormLabel>Progress (Slider)</FormLabel>
						<ExampleSlider name={fieldset.progress.config.name} required />
						<FormErrorMessage>{fieldset.progress.error}</FormErrorMessage>
					</FormControl>

					<FormControl isInvalid={Boolean(fieldset.active.error)}>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup
							name={fieldset.active.config.name}
							defaultValue={fieldset.active.config.defaultValue}
						>
							<Stack spacing={5} direction="row">
								<Radio
									value="yes"
									isRequired={fieldset.active.config.required ?? true}
								>
									Yes
								</Radio>
								<Radio
									value="no"
									isRequired={fieldset.active.config.required ?? true}
								>
									No
								</Radio>
							</Stack>
						</RadioGroup>
						<FormErrorMessage>{fieldset.active.error}</FormErrorMessage>
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
		</Container>
	);
}

function ExampleNumberInput(config: FieldConfig<number>) {
	const [value, setValue] = useState(config.defaultValue ?? '');
	const [inputRef, control] = useInputEvent({
		onReset: () => setValue(config.defaultValue ?? ''),
	});
	const ref = useRef<HTMLInputElement>(null);

	return (
		<>
			<input
				ref={inputRef}
				{...conform.input(config, { hidden: true })}
				onChange={(e) => setValue(e.target.value)}
				onFocus={() => inputRef.current?.focus()}
			/>
			<NumberInput
				ref={ref}
				isRequired={config.required}
				value={value}
				onChange={control.change}
			>
				<NumberInputField ref={ref} />
				<NumberInputStepper>
					<NumberIncrementStepper />
					<NumberDecrementStepper />
				</NumberInputStepper>
			</NumberInput>
		</>
	);
}

function ExamplePinInput({
	isInvalid,
	...config
}: FieldConfig<string> & { isInvalid: boolean }) {
	const [value, setValue] = useState(config.defaultValue ?? '');
	const [inputRef, control] = useInputEvent({
		onReset: () => setValue(config.defaultValue ?? ''),
	});
	const ref = useRef<HTMLInputElement>(null);

	return (
		<>
			<input
				ref={inputRef}
				{...conform.input(config, { hidden: true })}
				onChange={(e) => setValue(e.target.value)}
				onFocus={() => inputRef.current?.focus()}
			/>
			<PinInput
				type="alphanumeric"
				value={value}
				onChange={control.change}
				isInvalid={isInvalid}
			>
				<PinInputField ref={ref} />
				<PinInputField />
				<PinInputField />
				<PinInputField />
			</PinInput>
		</>
	);
}

function ExampleSlider(config: FieldConfig<number>) {
	const [value, setValue] = useState(config.defaultValue ?? '');
	const [inputRef, control] = useInputEvent({
		onReset: () => setValue(config.defaultValue ?? ''),
	});

	return (
		<>
			<input
				ref={inputRef}
				{...conform.input(config, { hidden: true })}
				onChange={(e) => setValue(e.target.value)}
				onFocus={() => inputRef.current?.focus()}
			/>
			<Slider
				value={value ? Number(value) : undefined}
				onChange={(value) => control.change(`${value}`)}
				onFocus={control.focus}
				onBlur={control.blur}
			>
				<SliderTrack>
					<SliderFilledTrack />
				</SliderTrack>
				<SliderThumb />
			</Slider>
		</>
	);
}
