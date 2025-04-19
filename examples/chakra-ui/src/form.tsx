import { useControl } from '@conform-to/react';
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
	const control = useControl({ defaultValue });

	return (
		<NumberInput
			isRequired
			name={name}
			value={control.value ?? ''}
			onChange={(value) => control.change(value)}
			onBlur={() => control.blur()}
			defaultValue={defaultValue}
		>
			<NumberInputField ref={control.register} />
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
	const control = useControl({ defaultValue, hidden: true });

	return (
		<>
			<input name={name} ref={control.register} defaultValue={defaultValue} />
			<PinInput
				type="alphanumeric"
				value={control.value ?? ''}
				onChange={(value) => control.change(value)}
			>
				<PinInputField onBlur={() => control.blur()} />
				<PinInputField onBlur={() => control.blur()} />
				<PinInputField onBlur={() => control.blur()} />
				<PinInputField onBlur={() => control.blur()} />
			</PinInput>
		</>
	);
}

type ExampleSliderProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleSlider({ name, defaultValue }: ExampleSliderProps) {
	const control = useControl({ defaultValue, hidden: true });

	return (
		<>
			<input name={name} ref={control.register} defaultValue={defaultValue} />
			<Slider
				min={0}
				max={10}
				step={1}
				value={control.value ? Number(control.value) : 0}
				onChange={(number) => control.change(number.toString())}
				onBlur={() => control.blur()}
			>
				<SliderTrack>
					<SliderFilledTrack />
				</SliderTrack>
				<SliderThumb />
			</Slider>
		</>
	);
}
