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
	ExampleListBox,
	ExampleCombobox,
	ExampleSwitch,
	ExampleRadioGroup,
} from './form';

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		return {
			get listBoxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
				} satisfies Partial<React.ComponentProps<typeof ExampleListBox>>;
			},
			get comboboxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleCombobox>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
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
