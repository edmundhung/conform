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
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof Input>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<'textarea'>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof CheckboxControl>>;
			},
			get checkboxGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof CheckboxGroupControl>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof RadioGroupControl>>;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof SelectControl>>;
			},
			get comboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof ComboboxControl>>;
			},
			get numberFieldProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof NumberFieldControl>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
				} satisfies Partial<ComponentProps<typeof SliderControl>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby':
						`${metadata.id}-description ${metadata.ariaDescribedBy ?? ''}`.trim(),
					invalid: !metadata.valid,
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
