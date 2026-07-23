import {
	configureForms,
	type FieldMetadata as BaseFieldMetadata,
	type FormMetadata as BaseFormMetadata,
	type Fieldset as BaseFieldset,
	type InferBaseErrorShape,
	type InferCustomFieldMetadata,
	type InferCustomFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type {
	ExampleSelect,
	ExampleToggleGroup,
	ExampleSwitch,
	ExampleSlider,
	ExampleRadioGroup,
	ExampleCheckbox,
} from './form';

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		return {
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleSelect>>;
			},
			get toggleGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<React.ComponentProps<typeof ExampleToggleGroup>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<React.ComponentProps<typeof ExampleSlider>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleCheckbox>>;
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
