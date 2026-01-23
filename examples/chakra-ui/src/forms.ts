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
