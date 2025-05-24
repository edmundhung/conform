import { useControl } from '@conform-to/react/future';
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
	RadioGroup,
	Editable,
	EditableInput,
	EditablePreview,
} from '@chakra-ui/react';
import { useRef } from 'react';

type ExampleNumberProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleNumberInput({ name, defaultValue }: ExampleNumberProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<NumberInput
			value={control.value ?? ''}
			onChange={(value) => control.change(value)}
			onBlur={() => control.blur()}
		>
			<input name={name} ref={control.register} hidden />
			<NumberInputField ref={inputRef} />
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
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<PinInput
			type="alphanumeric"
			value={control.value ?? ''}
			onChange={(value) => control.change(value)}
		>
			<input name={name} ref={control.register} hidden />
			<PinInputField onBlur={() => control.blur()} ref={ref} />
			<PinInputField onBlur={() => control.blur()} />
			<PinInputField onBlur={() => control.blur()} />
			<PinInputField onBlur={() => control.blur()} />
		</PinInput>
	);
}

type ExampleSliderProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleSlider({ name, defaultValue }: ExampleSliderProps) {
	const ref = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus: () => ref.current?.focus(),
	});

	return (
		<Slider
			min={0}
			max={10}
			step={1}
			value={control.value ? Number(control.value) : 0}
			onChange={(number) => control.change(number.toString())}
			onBlur={() => control.blur()}
		>
			<input name={name} ref={control.register} hidden />
			<SliderTrack>
				<SliderFilledTrack />
			</SliderTrack>
			<SliderThumb ref={ref} />
		</Slider>
	);
}

export type ExampleRadioGroupProps = {
	name: string;
	defaultValue?: string;
	children: React.ReactNode;
};

export function ExampleRadioGroup({
	name,
	defaultValue,
	children,
}: ExampleRadioGroupProps) {
	const control = useControl({ defaultValue });

	return (
		<RadioGroup
			name={name}
			ref={(wrapper) => control.register(wrapper?.querySelectorAll('input'))}
			value={control.value ?? ''}
			onChange={(value) => control.change(value)}
			onBlur={() => control.blur()}
		>
			{children}
		</RadioGroup>
	);
}

export type ExampleEditableProps = {
	name: string;
	defaultValue?: string;
};

export function ExampleEditable({ name, defaultValue }: ExampleEditableProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<Editable
			placeholder="No content"
			value={control.value ?? ''}
			onChange={(value) => control.change(value)}
		>
			<input name={name} ref={control.register} hidden />
			<EditablePreview ref={ref} />
			<EditableInput />
		</Editable>
	);
}
