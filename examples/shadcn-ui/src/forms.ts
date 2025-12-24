import {
	configureForms,
	InferFieldMetadata,
	InferFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';
import type {
	DatePicker,
	ComboBox,
	RadioGroup,
	Checkbox,
	Select,
	Slider,
	Switch,
	SingleToggleGroup,
	MultiToggleGroup,
	InputOTP,
} from './components/form';

const result = configureForms({
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
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<'input'>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<'textarea'>>;
			},
			get datePickerProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof DatePicker>>;
			},
			get comboBoxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof ComboBox>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof RadioGroup>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Select>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Slider>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Switch>>;
			},
			get singleToggleGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': metadata.id,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof SingleToggleGroup>>;
			},
			get multiToggleGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-labelledby': metadata.id,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof MultiToggleGroup>>;
			},
			get inputOTPProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof InputOTP>>;
			},
		};
	},
});

export type FormMetadata = InferFormMetadata<typeof result.config>;
export type FieldMetadata<FieldShape> = InferFieldMetadata<
	typeof result.config,
	FieldShape
>;

export const useForm = result.useForm;
