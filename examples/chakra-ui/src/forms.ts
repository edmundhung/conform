import {
	configureForms,
	InferFieldMetadata,
	InferFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';
import type {
	Input,
	Select,
	Textarea,
	Checkbox,
	Switch,
} from '@chakra-ui/react';
import type {
	ExampleNumberInput,
	ExamplePinInput,
	ExampleSlider,
	ExampleRadioGroup,
	ExampleEditable,
} from './form';

const result = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		return {
			get inputProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
				} satisfies Partial<React.ComponentProps<typeof Input>>;
			},
			get selectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
				} satisfies Partial<React.ComponentProps<typeof Select>>;
			},
			get textareaProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
				} satisfies Partial<React.ComponentProps<typeof Textarea>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					required: metadata.required,
				} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					required: metadata.required,
				} satisfies Partial<React.ComponentProps<typeof Switch>>;
			},
			get numberInputProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleNumberInput>>;
			},
			get pinInputProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExamplePinInput>>;
			},
			get sliderProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleSlider>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
			},
			get editableProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleEditable>>;
			},
		};
	},
});

export type FormMetadata = InferFormMetadata<typeof result.config>;
export type FieldMetadata<FieldShape> = InferFieldMetadata<
	typeof result.config,
	FieldShape
>;

export const useForm = result.useForm;
