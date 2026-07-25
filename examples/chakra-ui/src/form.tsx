import { BaseControl, useControl } from '@conform-to/react/future';
import {
	Button,
	Checkbox,
	Editable,
	FileUpload,
	NumberInput,
	PinInput,
	RadioGroup,
	Slider,
	Switch,
	TagsInput,
} from '@chakra-ui/react';
import { useRef } from 'react';

type ControlProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	required?: boolean;
	invalid?: boolean;
	'aria-describedby'?: string;
};

type ChakraChildren = React.ComponentProps<typeof Checkbox.Root>['children'];

function isFocusLeaving(event: React.FocusEvent<HTMLElement>) {
	return !event.currentTarget.contains(event.relatedTarget);
}

export type ExampleNumberInputProps = ControlProps;

export function ExampleNumberInput({
	name,
	defaultValue,
	...props
}: ExampleNumberInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<NumberInput.Root
				ids={{ input: props.id }}
				value={control.value ?? ''}
				onValueChange={({ value }) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				invalid={props.invalid}
				required={props.required}
			>
				<NumberInput.Input
					ref={inputRef}
					aria-describedby={props['aria-describedby']}
				/>
				<NumberInput.Control />
			</NumberInput.Root>
		</>
	);
}

export type ExamplePinInputProps = ControlProps;

export function ExamplePinInput({
	name,
	defaultValue,
	...props
}: ExamplePinInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<PinInput.Root
				ids={{
					input: (index) =>
						Number(index) === 0
							? (props.id ?? `${name}-segment-1`)
							: `${props.id ?? name}-segment-${Number(index) + 1}`,
				}}
				type="alphanumeric"
				value={control.value ? control.value.split('') : []}
				onValueChange={({ valueAsString }) => control.change(valueAsString)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				invalid={props.invalid}
				required={props.required}
			>
				<PinInput.HiddenInput />
				<PinInput.Control>
					{Array.from({ length: 4 }, (_, index) => (
						<PinInput.Input
							key={index}
							index={index}
							ref={index === 0 ? inputRef : undefined}
							aria-describedby={props['aria-describedby']}
						/>
					))}
				</PinInput.Control>
			</PinInput.Root>
		</>
	);
}

export type ExampleSliderProps = ControlProps;

export function ExampleSlider({
	name,
	defaultValue,
	...props
}: ExampleSliderProps) {
	const thumbRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			thumbRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Slider.Root
				width="full"
				ids={{
					thumb: (index) =>
						index === 0 ? (props.id ?? name) : `${props.id ?? name}-${index}`,
				}}
				min={0}
				max={10}
				step={1}
				value={[Number(control.value || 0)]}
				onValueChange={({ value }) =>
					control.change(value[0]?.toString() ?? '')
				}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				invalid={props.invalid}
				aria-describedby={props['aria-describedby']}
			>
				<Slider.Control>
					<Slider.Track>
						<Slider.Range />
					</Slider.Track>
					<Slider.Thumb ref={thumbRef} index={0}>
						<Slider.HiddenInput />
					</Slider.Thumb>
				</Slider.Control>
			</Slider.Root>
		</>
	);
}

export type ExampleRadioGroupProps = ControlProps & {
	children: ChakraChildren;
	'aria-labelledby'?: string;
};

export function ExampleRadioGroup({
	name,
	defaultValue,
	children,
	...props
}: ExampleRadioGroupProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			rootRef.current?.querySelector<HTMLInputElement>('input')?.focus();
		},
	});

	return (
		<RadioGroup.Root
			ref={(root) => {
				rootRef.current = root;
				control.register(root?.querySelectorAll('input'));
			}}
			name={name}
			value={control.value ?? ''}
			onValueChange={({ value }) => control.change(value)}
			onBlur={(event) => {
				if (isFocusLeaving(event)) control.blur();
			}}
			invalid={props.invalid}
			required={props.required}
			aria-labelledby={props['aria-labelledby']}
			aria-describedby={props['aria-describedby']}
		>
			{children}
		</RadioGroup.Root>
	);
}

export type ExampleEditableProps = ControlProps;

export function ExampleEditable({
	name,
	defaultValue,
	...props
}: ExampleEditableProps) {
	const previewRef = useRef<HTMLSpanElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			previewRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Editable.Root
				ids={{ preview: props.id }}
				placeholder="No content"
				value={control.value ?? ''}
				onValueChange={({ value }) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				invalid={props.invalid}
			>
				<Editable.Preview
					ref={previewRef}
					aria-describedby={props['aria-describedby']}
				/>
				<Editable.Input aria-describedby={props['aria-describedby']} />
			</Editable.Root>
		</>
	);
}

type CheckedControlProps = Omit<ControlProps, 'defaultValue'> & {
	value?: string;
	defaultChecked?: boolean;
	children?: ChakraChildren;
};

export type ExampleCheckboxProps = CheckedControlProps;

export function ExampleCheckbox({
	name,
	value = 'on',
	defaultChecked,
	children,
	...props
}: ExampleCheckboxProps) {
	return (
		<Checkbox.Root
			ids={{ hiddenInput: props.id }}
			name={name}
			value={value}
			defaultChecked={defaultChecked}
			invalid={props.invalid}
			required={props.required}
		>
			<Checkbox.HiddenInput aria-describedby={props['aria-describedby']} />
			<Checkbox.Control>
				<Checkbox.Indicator />
			</Checkbox.Control>
			<Checkbox.Label>{children}</Checkbox.Label>
		</Checkbox.Root>
	);
}

export type ExampleSwitchProps = CheckedControlProps;

export function ExampleSwitch({
	name,
	value = 'on',
	defaultChecked,
	children,
	...props
}: ExampleSwitchProps) {
	return (
		<Switch.Root
			ids={{ hiddenInput: props.id }}
			name={name}
			value={value}
			defaultChecked={defaultChecked}
			invalid={props.invalid}
			required={props.required}
		>
			<Switch.HiddenInput aria-describedby={props['aria-describedby']} />
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
			{children ? <Switch.Label>{children}</Switch.Label> : null}
		</Switch.Root>
	);
}

export type ExampleTagsInputProps = Omit<ControlProps, 'defaultValue'> & {
	defaultValue?: string[];
};

export function ExampleTagsInput({
	name,
	defaultValue,
	...props
}: ExampleTagsInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="select"
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? []}
			/>
			<TagsInput.Root
				ids={{ input: props.id }}
				value={control.options ?? []}
				onValueChange={({ value }) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				invalid={props.invalid}
				required={props.required}
				addOnPaste
			>
				<TagsInput.HiddenInput />
				<TagsInput.Control>
					<TagsInput.Items />
					<TagsInput.Input
						ref={inputRef}
						placeholder="Type a tag and press Enter"
						aria-describedby={props['aria-describedby']}
					/>
				</TagsInput.Control>
			</TagsInput.Root>
		</>
	);
}

export type ExampleFileUploadProps = Omit<ControlProps, 'defaultValue'>;

export function ExampleFileUpload({ name, ...props }: ExampleFileUploadProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl type="file" name={name} ref={control.register} />
			<FileUpload.Root
				ids={{ hiddenInput: props.id }}
				acceptedFiles={control.files ?? []}
				onFileChange={({ acceptedFiles }) => control.change(acceptedFiles)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				maxFiles={1}
				invalid={props.invalid}
				required={props.required}
			>
				<FileUpload.HiddenInput aria-describedby={props['aria-describedby']} />
				<FileUpload.Trigger asChild>
					<Button ref={triggerRef} type="button" variant="outline">
						Choose file
					</Button>
				</FileUpload.Trigger>
				<FileUpload.List />
			</FileUpload.Root>
		</>
	);
}
