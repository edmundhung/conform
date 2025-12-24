import {
	configureForms,
	InferFieldMetadata,
	InferFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';
import type {
	ExampleSelect,
	ExampleToggleGroup,
	ExampleSwitch,
	ExampleSlider,
	ExampleRadioGroup,
	ExampleCheckbox,
} from './form';

const result = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		return {
			get selectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleSelect>>;
			},
			get toggleGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleToggleGroup>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
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
			get checkboxProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<React.ComponentProps<typeof ExampleCheckbox>>;
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
