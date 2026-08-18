import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type { ComponentProps } from 'react';
import type {
	DatePicker,
	FormCheckbox,
	FormCombobox,
	FormRadioGroup,
	FormSelect,
	FormSlider,
	FormSwitch,
	InputOTP,
	MultiCombobox,
} from './components/form';
import type { InputGroupInput } from './components/ui/input-group';
import type { NativeSelect } from './components/ui/native-select';
import type { Textarea } from './components/ui/textarea';

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
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof InputGroupInput>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof Textarea>>;
			},
			get nativeSelectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof NativeSelect>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof FormCheckbox>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof FormRadioGroup>>;
			},
			get radioItemProps() {
				return {
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				};
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof FormSelect>>;
			},
			get comboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof FormCombobox>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof FormSlider>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof FormSwitch>>;
			},
			get datePickerProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof DatePicker>>;
			},
			get multiComboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof MultiCombobox>>;
			},
			get inputOTPProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': [metadata.descriptionId, metadata.ariaDescribedBy]
						.filter(Boolean)
						.join(' '),
				} satisfies Partial<ComponentProps<typeof InputOTP>>;
			},
		};
	},
});

export const useForm = forms.useForm;
