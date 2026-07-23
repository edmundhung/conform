import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type { InputProps, SelectProps, TextareaProps } from '@headlessui/react';
import type {
	ExampleCheckbox,
	ExampleCombobox,
	ExampleListBox,
	ExampleRadioGroup,
	ExampleSwitch,
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
					required: metadata.required,
					invalid: metadata.invalid,
				} satisfies Partial<InputProps>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: metadata.invalid,
				} satisfies Partial<TextareaProps>;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					required: metadata.required,
					invalid: metadata.invalid,
				} satisfies Partial<SelectProps>;
			},
			get listBoxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleListBox>>;
			},
			get comboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleCombobox>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleCheckbox>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-errormessage': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
			},
		};
	},
});

export const useForm = forms.useForm;
