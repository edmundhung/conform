import { type FieldConfig, useForm, useFieldset } from '@conform-to/react';
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
	RangeSlider,
	RangeSliderFilledTrack,
	RangeSliderThumb,
	RangeSliderTrack,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { BaseInput, useInputControl } from './base';

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
	const form = useForm<Schema>();
	const fieldset = useFieldset(form.ref, form.config);

	return (
		<Container maxW="container.sm" paddingY={8}>
			<form {...form.props}>
				<Stack direction="column" spacing={8}>
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

					<FormControl isInvalid={Boolean(fieldset.ranges.error)}>
						<FormLabel>Ranges (RangeSlider)</FormLabel>
						<ExampleRangeSlider name={fieldset.ranges.config.name} required />
						<FormErrorMessage>{fieldset.ranges.error}</FormErrorMessage>
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

function ExampleNumberInput({ name, required }: FieldConfig<number>) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useInputControl(ref);

	return (
		<NumberInput name={name} isRequired={required} onChange={control.onChange}>
			<NumberInputField ref={ref} />
			<NumberInputStepper>
				<NumberIncrementStepper />
				<NumberDecrementStepper />
			</NumberInputStepper>
		</NumberInput>
	);
}

function ExamplePinInput({
	name,
	required,
	pattern,
	isInvalid,
}: FieldConfig<string> & { isInvalid: boolean }) {
	const baseRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useInputControl(baseRef);

	return (
		<>
			<BaseInput
				name={name}
				required={required}
				pattern={pattern}
				ref={baseRef}
				onFocus={() => inputRef.current?.focus()}
			/>
			<PinInput
				type="alphanumeric"
				onChange={control.onChange}
				isInvalid={isInvalid}
			>
				<PinInputField ref={inputRef} />
				<PinInputField />
				<PinInputField />
				<PinInputField />
			</PinInput>
		</>
	);
}

function ExampleSlider({ name, defaultValue, required }: FieldConfig<number>) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useInputControl(ref);

	return (
		<>
			<BaseInput ref={ref} name={name} required={required} />
			<Slider
				defaultValue={defaultValue ? Number(defaultValue) : undefined}
				onChange={(value) => control.onChange(`${value}`)}
				onFocus={control.onFocus}
				onBlur={control.onBlur}
			>
				<SliderTrack>
					<SliderFilledTrack />
				</SliderTrack>
				<SliderThumb />
			</Slider>
		</>
	);
}

/**
 * RangeSlider validation is not supported at the moment
 */
function ExampleRangeSlider({ name, defaultValue }: FieldConfig<number[]>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const ref0 = useRef<HTMLInputElement>(null);
	const ref1 = useRef<HTMLInputElement>(null);
	const control0 = useInputControl(ref0);
	const control1 = useInputControl(ref1);

	return (
		<fieldset ref={ref}>
			<BaseInput ref={ref0} name={`${name}[0]`} />
			<BaseInput ref={ref1} name={`${name}[1]`} />
			<RangeSlider
				defaultValue={defaultValue?.map(Number)}
				onChange={([value0, value1]) => {
					control0.onChange(`${value0}`);
					control1.onChange(`${value1}`);
				}}
			>
				<RangeSliderTrack>
					<RangeSliderFilledTrack />
				</RangeSliderTrack>
				<RangeSliderThumb index={0} />
				<RangeSliderThumb index={1} />
			</RangeSlider>
		</fieldset>
	);
}
