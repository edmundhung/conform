import {
	configureForms,
	shape,
	type FieldMetadata as BaseFieldMetadata,
	type FormMetadata as BaseFormMetadata,
	type Fieldset as BaseFieldset,
	type InferBaseErrorShape,
	type InferCustomFieldMetadata,
	type InferCustomFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type { TextField } from './components/TextField';
import type { NumberField } from './components/NumberField';
import type { RadioGroup } from './components/RadioGroup';
import type { CheckboxGroup } from './components/CheckboxGroup';
import type { DatePicker } from './components/DatePicker';
import type { Select } from './components/Select';
import type { ComboBox, MultiSelectComboBox } from './components/ComboBox';
import type { FileTrigger } from './components/FileTrigger';
import type { Checkbox } from './components/Checkbox';
import type { DateRangePicker } from './components/DateRangePicker';
import type { Switch } from './components/Switch';

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	isError: shape<string[]>(),
	extendFormMetadata(metadata) {
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
	extendFieldMetadata(metadata, { when }) {
		return {
			get textFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof TextField>>;
			},
			get numberFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof NumberField>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof RadioGroup>>;
			},
			get checkboxGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof CheckboxGroup>>;
			},
			get datePickerProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof DatePicker>>;
			},
			get selectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof Select>>;
			},
			get comboBoxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof ComboBox>>;
			},
			get multiSelectComboBoxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof MultiSelectComboBox>>;
			},
			get fileTriggerProps() {
				return {
					name: metadata.name,
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof FileTrigger>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					defaultSelected: metadata.defaultValue === 'on',
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					defaultSelected: metadata.defaultValue === 'on',
					isRequired: metadata.required,
					isInvalid: !metadata.valid,
					errors: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof Switch>>;
			},
			get dateRangePickerProps() {
				return when(
					metadata,
					shape<{ start: string; end: string }>(),
					(fieldset) => {
						const fields = fieldset.getFieldset();

						return {
							name: fieldset.name,
							defaultValue: {
								start: fields.start.defaultValue,
								end: fields.end.defaultValue,
							},
							isRequired: fieldset.required,
							isInvalid: !fieldset.valid,
							errors: [
								...new Set<string>([
									...(fieldset.errors ?? []),
									...(fieldset.fieldErrors.start ?? []),
									...(fieldset.fieldErrors.end ?? []),
								]),
							],
						} satisfies Partial<React.ComponentProps<typeof DateRangePicker>>;
					},
				);
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
