import {
	type BaseMetadata,
	FormOptionsProvider,
} from '@conform-to/react/future';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import type { TextField, Checkbox, RadioGroup, Switch } from '@mui/material';
import type { Autocomplete, Rating, Slider } from './form';

// Define custom metadata properties that matches the type of our custom form components
function defineCustomMetadata<FieldShape, ErrorShape>(
	metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
	return {
		get textFieldProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
				error: !metadata.valid,
				helperText: metadata.errors?.map((error) => `${error}`),
			} satisfies Partial<React.ComponentProps<typeof TextField>>;
		},
		get autocompleteProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
				error: metadata.errors?.map((error) => `${error}`),
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
}

type MetadataDefinition<FieldShape, ErrorShape> = ReturnType<
	typeof defineCustomMetadata<FieldShape, ErrorShape>
>;

// Extend the CustomMetadata interface with our UI component props
// This makes the custom metadata available on all field metadata objects
declare module '@conform-to/react/future' {
	interface CustomMetadata<FieldShape, ErrorShape>
		extends MetadataDefinition<FieldShape, ErrorShape> {}
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<FormOptionsProvider
			shouldValidate="onBlur"
			shouldRevalidate="onInput"
			defineCustomMetadata={defineCustomMetadata}
		>
			<App />
		</FormOptionsProvider>
	</StrictMode>,
);
