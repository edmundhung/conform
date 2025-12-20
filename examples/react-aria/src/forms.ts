import { configureForms, shape } from '@conform-to/react/future';
import { zodSchema } from '@conform-to/zod/v3/future';
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

const { useForm } = configureForms({
	schema: zodSchema,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	errorShape: shape<string>(),
	formMetadata(metadata) {
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
	fieldMetadata(metadata, { whenField }) {
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
				return whenField(
					metadata,
					shape<{ start: string; end: string }>(),
					({ valid, errors, getFieldset }) => {
						const rangeFields = getFieldset();

						return {
							startName: rangeFields.start.name,
							endName: rangeFields.end.name,
							defaultValue: {
								start: rangeFields.start.defaultValue,
								end: rangeFields.end.defaultValue,
							},
							isInvalid: !valid,
							errors,
						} satisfies Partial<React.ComponentProps<typeof DateRangePicker>>;
					},
				);
			},
		};
	},
});

export { useForm };
