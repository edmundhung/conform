import {
	configureForms,
	type FieldMetadata as BaseFieldMetadata,
	type FormMetadata as BaseFormMetadata,
	type Fieldset as BaseFieldset,
	type InferBaseErrorShape,
	type InferCustomFieldMetadata,
	type InferCustomFormMetadata,
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

export type FormMetadata<
	ErrorShape extends InferBaseErrorShape<
		typeof result.config
	> = InferBaseErrorShape<typeof result.config>,
> = BaseFormMetadata<
	ErrorShape,
	InferCustomFormMetadata<typeof result.config>,
	InferCustomFieldMetadata<typeof result.config>
>;

export type FieldMetadata<
	FieldShape,
	ErrorShape extends InferBaseErrorShape<
		typeof result.config
	> = InferBaseErrorShape<typeof result.config>,
> = BaseFieldMetadata<
	FieldShape,
	ErrorShape,
	InferCustomFieldMetadata<typeof result.config>
>;

export type Fieldset<
	FieldShape,
	ErrorShape extends InferBaseErrorShape<
		typeof result.config
	> = InferBaseErrorShape<typeof result.config>,
> = BaseFieldset<
	FieldShape,
	ErrorShape,
	InferCustomFieldMetadata<typeof result.config>
>;

export const useForm = result.useForm;
