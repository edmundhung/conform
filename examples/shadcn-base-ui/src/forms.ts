import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type {
	DatePicker,
	FormCheckbox,
	FormCombobox,
	FormRadioGroup,
	FormSelect,
	FormSwitch,
	InputOTP,
	MultiCombobox,
} from './components/form-controls';
import type { InputGroupInput } from './components/ui/input-group';
import type { NativeSelect } from './components/ui/native-select';
import type { Slider } from './components/ui/slider';
import type { Textarea } from './components/ui/textarea';

function describedBy(descriptionId: string, errorId?: string) {
	return [descriptionId, errorId].filter(Boolean).join(' ');
}

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		const ariaProps = {
			'aria-invalid': metadata.ariaInvalid,
			'aria-describedby': describedBy(
				metadata.descriptionId,
				metadata.ariaDescribedBy,
			),
		};

		return {
			get inputProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof InputGroupInput>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof Textarea>>;
			},
			get nativeSelectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof NativeSelect>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof FormCheckbox>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof FormRadioGroup>>;
			},
			get radioItemProps() {
				return ariaProps;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof FormSelect>>;
			},
			get comboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof FormCombobox>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: [Number(metadata.defaultValue || 0)],
					'aria-labelledby': `${metadata.id}-label`,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof Slider>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof FormSwitch>>;
			},
			get datePickerProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof DatePicker>>;
			},
			get multiComboboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-labelledby': `${metadata.id}-label`,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof MultiCombobox>>;
			},
			get inputOTPProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					...ariaProps,
				} satisfies Partial<React.ComponentProps<typeof InputOTP>>;
			},
		};
	},
});

export const useForm = forms.useForm;
