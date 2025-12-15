import { configureConform } from '@conform-to/react/future';
import type { TextField } from './components/TextField';
import type { NumberField } from './components/NumberField';
import type { RadioGroup } from './components/RadioGroup';
import type { CheckboxGroup } from './components/CheckboxGroup';
import type { DatePicker } from './components/DatePicker';
import type { Select } from './components/Select';
import type { ComboBox } from './components/ComboBox';
import type { FileTrigger } from './components/FileTrigger';
import type { Checkbox } from './components/Checkbox';
import type { DateRangePicker } from './components/DateRangePicker';

function defineTypes<T>(
	guard?: (value: unknown) => boolean,
): (value: unknown) => value is T {
	return (value): value is T => guard?.(value) ?? true;
}

const {
	useForm,
	useFormMetadata,
	useField,
	useFormData,
	useControl,
	useIntent,
} = configureConform({
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	assertErrorShape: defineTypes<string>((error) => typeof error === 'string'),
	customizeFormMetadata(metadata) {
		return {
			get props() {
				return {
					...metadata.props,
					'aria-invalid': !metadata.valid,
					'aria-describedby': !metadata.valid
						? metadata.descriptionId
						: undefined,
				};
			},
		};
	},
	customizeFieldMetadata(metadata) {
		return {
			get textFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof TextField>>;
			},
			get numberFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof NumberField>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof RadioGroup>>;
			},
			get checkboxGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof CheckboxGroup>>;
			},
			get datePickerProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof DatePicker>>;
			},
			get selectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof Select>>;
			},
			get comboBoxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof ComboBox>>;
			},
			get fileTriggerProps() {
				return {
					name: metadata.name,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof FileTrigger>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					defaultSelected: metadata.defaultValue === 'on',
					isInvalid: !metadata.valid,
				} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
			},
			get dateRangePickerProps() {
				const rangeFields = metadata.getFieldset<{
					start: string;
					end: string;
				}>();

				return {
					startName: rangeFields.start.name,
					endName: rangeFields.end.name,
					defaultValue: {
						start: rangeFields.start.defaultValue,
						end: rangeFields.end.defaultValue,
					},
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof DateRangePicker>>;
			},
		};
	},
	// dateRangePickerProps is only available when FieldShape has start and end
	customizeFieldMetadataConditions: {
		dateRangePickerProps: defineTypes<{ start: string; end: string }>(),
	},
});

export {
	useForm,
	useFormMetadata,
	useField,
	useFormData,
	useControl,
	useIntent,
};
