import { useInput } from 'conform-react';
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
	defaultValue?: string;
};

export function ExampleNumberInput({ name, defaultValue }: ExampleNumberProps) {
	const input = useInput(defaultValue);

	return (
		<NumberInput
			isRequired
			name={name}
			value={input.value ?? ''}
			onChange={(value) => input.change(value)}
			onBlur={() => input.blur()}
			defaultValue={defaultValue}
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
	defaultValue?: string;
};

export function ExamplePinInput({ name, defaultValue }: ExamplePinProps) {
	const input = useInput(defaultValue);

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultValue={defaultValue}
			/>
			<PinInput
				type="alphanumeric"
				value={input.value ?? ''}
				onChange={(value) => input.change(value)}
			>
				<PinInputField onBlur={() => input.blur()} />
				<PinInputField onBlur={() => input.blur()} />
				<PinInputField onBlur={() => input.blur()} />
				<PinInputField onBlur={() => input.blur()} />
			</PinInput>
		</>
	);
}

type ExampleSliderProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleSlider({ name, defaultValue }: ExampleSliderProps) {
	const input = useInput(defaultValue);

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultValue={defaultValue}
			/>
			<Slider
				min={0}
				max={10}
				step={1}
				value={input.value ? Number(input.value) : 0}
				onChange={(number) => input.change(number.toString())}
				onBlur={() => input.blur()}
			>
				<SliderTrack>
					<SliderFilledTrack />
				</SliderTrack>
				<SliderThumb />
			</Slider>
		</>
	);
}
