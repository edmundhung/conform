import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type { Input } from '@base-ui/react/input';
import type { ComponentProps } from 'react';
import type {
	CheckboxControl,
	CheckboxGroupControl,
	ComboboxControl,
	NumberFieldControl,
	RadioGroupControl,
	SelectControl,
	SliderControl,
	SwitchControl,
} from './components';

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
				} satisfies Partial<ComponentProps<typeof Input>>;
			},
			get textareaProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<'textarea'>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<ComponentProps<typeof CheckboxControl>>;
			},
			get checkboxGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
				} satisfies Partial<ComponentProps<typeof CheckboxGroupControl>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof RadioGroupControl>>;
			},
			get selectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof SelectControl>>;
			},
			get comboboxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof ComboboxControl>>;
			},
			get numberFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof NumberFieldControl>>;
			},
			get sliderProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<ComponentProps<typeof SliderControl>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<ComponentProps<typeof SwitchControl>>;
			},
		};
	},
});

export const useForm = forms.useForm;
