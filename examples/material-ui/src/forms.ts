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
import type { TextField, Checkbox, RadioGroup, Switch } from '@mui/material';
import type { Autocomplete, NumberField, Rating, Slider } from './form';

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	isError: shape<string[]>(),
	extendFieldMetadata(metadata) {
		return {
			get textFieldProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					error: !metadata.valid,
					helperText: metadata.errors,
				} satisfies Partial<React.ComponentProps<typeof TextField>>;
			},
			get autocompleteProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					error: metadata.errors,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof Autocomplete>>;
			},
			get numberFieldProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					error: !metadata.valid,
					helperText: metadata.errors,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
				} satisfies Partial<React.ComponentProps<typeof NumberField>>;
			},
			get checkboxProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					slotProps: {
						input: {
							id: metadata.id,
							'aria-invalid': metadata.ariaInvalid,
							'aria-describedby': metadata.ariaDescribedBy,
						},
					},
				} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<React.ComponentProps<typeof RadioGroup>>;
			},
			get switchProps() {
				return {
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					slotProps: {
						input: {
							id: metadata.id,
							'aria-invalid': metadata.ariaInvalid,
							'aria-describedby': metadata.ariaDescribedBy,
						},
					},
				} satisfies Partial<React.ComponentProps<typeof Switch>>;
			},
			get ratingProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<React.ComponentProps<typeof Rating>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-invalid': metadata.ariaInvalid,
					'aria-describedby': metadata.ariaDescribedBy,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<React.ComponentProps<typeof Slider>>;
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
