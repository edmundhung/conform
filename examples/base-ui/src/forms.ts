import {
	configureForms,
	type FieldMetadata as BaseFieldMetadata,
	type Fieldset as BaseFieldset,
	type FormMetadata as BaseFormMetadata,
	type InferBaseErrorShape,
	type InferCustomFieldMetadata,
	type InferCustomFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type { Input } from '@base-ui/react/input';
import type { ComponentProps } from 'react';
import type {
	CheckboxControl,
	CheckboxGroupControl,
	ComboboxControl,
	NumberFieldControl,
	RadioGroupControl,
	SelectControl,
	SliderControl,
	SwitchControl,
} from './components';

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		return {
			get inputProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof Input>>;
			},
			get textareaProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<'textarea'>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<ComponentProps<typeof CheckboxControl>>;
			},
			get checkboxGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
				} satisfies Partial<ComponentProps<typeof CheckboxGroupControl>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof RadioGroupControl>>;
			},
			get selectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof SelectControl>>;
			},
			get comboboxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof ComboboxControl>>;
			},
			get numberFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof NumberFieldControl>>;
			},
			get sliderProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof SliderControl>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<ComponentProps<typeof SwitchControl>>;
			},
		};
	},
});

type BaseErrorShape = InferBaseErrorShape<typeof forms.config>;
type CustomFormMetadata = InferCustomFormMetadata<typeof forms.config>;
type CustomFieldMetadata = InferCustomFieldMetadata<typeof forms.config>;

export type FormMetadata<ErrorShape extends BaseErrorShape = BaseErrorShape> =
	BaseFormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata>;

export type FieldMetadata<
	FieldShape,
	ErrorShape extends BaseErrorShape = BaseErrorShape,
> = BaseFieldMetadata<FieldShape, ErrorShape, CustomFieldMetadata>;

export type Fieldset<
	FieldShape,
	ErrorShape extends BaseErrorShape = BaseErrorShape,
> = BaseFieldset<FieldShape, ErrorShape, CustomFieldMetadata>;

export const useForm = forms.useForm;
