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
import type { Input, NativeSelect, Textarea } from '@chakra-ui/react';
import type {
	ExampleCheckbox,
	ExampleFileUpload,
	ExampleNumberInput,
	ExamplePinInput,
	ExampleSlider,
	ExampleRadioGroup,
	ExampleEditable,
	ExampleSwitch,
	ExampleTagsInput,
} from './form';

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
					required: metadata.required,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Input>>;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof NativeSelect.Field>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Textarea>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleCheckbox>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
			},
			get numberInputProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleNumberInput>>;
			},
			get pinInputProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExamplePinInput>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleSlider>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
			},
			get editableProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleEditable>>;
			},
			get tagsInputProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleTagsInput>>;
			},
			get fileUploadProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					required: metadata.required,
					invalid: !metadata.valid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleFileUpload>>;
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
