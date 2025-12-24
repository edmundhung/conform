import {
	configureForms,
	InferFieldMetadata,
	InferFormMetadata,
	shape,
} from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';
import type { TextField, Checkbox, RadioGroup, Switch } from '@mui/material';
import type { Autocomplete, Rating, Slider } from './form';

const result = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	isError: shape<string>(),
	extendFieldMetadata(metadata) {
		return {
			get textFieldProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					error: !metadata.valid,
					helperText: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof TextField>>;
			},
			get autocompleteProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					error: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof Autocomplete>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
			},
			get radioGroupProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof RadioGroup>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
				} satisfies Partial<React.ComponentProps<typeof Switch>>;
			},
			get ratingProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof Rating>>;
			},
			get sliderProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultValue,
				} satisfies Partial<React.ComponentProps<typeof Slider>>;
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
