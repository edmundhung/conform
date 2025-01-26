import { useCustomInput } from 'conform-react';
import {
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	PinInput,
	PinInputField,
	Slider,
	SliderTrack,
	SliderFilledTrack,
	SliderThumb,
} from '@chakra-ui/react';

type ExampleNumberProps = {
	name: string;
};

export function ExampleNumberInput({ name }: ExampleNumberProps) {
	const input = useCustomInput();

	return (
		<NumberInput
			isRequired
			name={name}
			value={input.value ?? ''}
			onChange={(value) => input.changed(value)}
			onBlur={() => input.blurred()}
		>
			<NumberInputField ref={input.register} />
			<NumberInputStepper>
				<NumberIncrementStepper />
				<NumberDecrementStepper />
			</NumberInputStepper>
		</NumberInput>
	);
}

type ExamplePinProps = {
	name: string;
};

export function ExamplePinInput({ name }: ExamplePinProps) {
	const input = useCustomInput();

	return (
		<>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<PinInput
				type="alphanumeric"
				value={input.value ?? ''}
				onChange={(value) => input.changed(value)}
			>
				<PinInputField onBlur={() => input.blurred()} />
				<PinInputField onBlur={() => input.blurred()} />
				<PinInputField onBlur={() => input.blurred()} />
				<PinInputField onBlur={() => input.blurred()} />
			</PinInput>
		</>
	);
}

type ExampleSliderProps = {
	name: string;
};

export function ExampleSlider({ name }: ExampleSliderProps) {
	const input = useCustomInput();

	return (
		<>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<Slider
				min={0}
				max={10}
				step={1}
				value={input.value ? Number(input.value) : 0}
				onChange={(number) => input.changed(number.toString())}
				onBlur={() => input.blurred()}
			>
				<SliderTrack>
					<SliderFilledTrack />
				</SliderTrack>
				<SliderThumb />
			</Slider>
		</>
	);
}
