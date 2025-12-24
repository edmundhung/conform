import {
	configureForms,
	InferFieldMetadata,
	InferFormMetadata,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';
import type {
	ExampleListBox,
	ExampleCombobox,
	ExampleSwitch,
	ExampleRadioGroup,
} from './form';

const result = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		return {
			get listBoxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
				} satisfies Partial<React.ComponentProps<typeof ExampleListBox>>;
			},
			get comboboxProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleCombobox>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<React.ComponentProps<typeof ExampleSwitch>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
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
