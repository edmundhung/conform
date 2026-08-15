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
import type { ComponentProps } from 'react';
import type {
	CheckboxField,
	CheckboxGroupField,
	ComboboxField,
	NumberFieldControl,
	RadioGroupField,
	SelectField,
	SliderField,
	SwitchField,
	TextareaField,
	TextInputField,
} from './components';

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		const status = {
			id: metadata.id,
			name: metadata.name,
			invalid: !metadata.valid,
			errors: metadata.errors,
		};
		return {
			get textInputProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof TextInputField>>;
			},
			get textareaProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof TextareaField>>;
			},
			get checkboxProps() {
				return {
					...status,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<ComponentProps<typeof CheckboxField>>;
			},
			get checkboxGroupProps() {
				return {
					...status,
					defaultValue: metadata.defaultOptions,
				} satisfies Partial<ComponentProps<typeof CheckboxGroupField>>;
			},
			get radioGroupProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof RadioGroupField>>;
			},
			get selectProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof SelectField>>;
			},
			get comboboxProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof ComboboxField>>;
			},
			get numberFieldProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof NumberFieldControl>>;
			},
			get sliderProps() {
				return {
					...status,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof SliderField>>;
			},
			get switchProps() {
				return {
					...status,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<ComponentProps<typeof SwitchField>>;
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
