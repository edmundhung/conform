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
		return {
			get textInputProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof TextInputField>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof TextareaField>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof CheckboxField>>;
			},
			get checkboxGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof CheckboxGroupField>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof RadioGroupField>>;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof SelectField>>;
			},
			get comboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof ComboboxField>>;
			},
			get numberFieldProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof NumberFieldControl>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<ComponentProps<typeof SliderField>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
					errors: metadata.errors,
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
