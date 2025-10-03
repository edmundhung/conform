import {
	type BaseMetadata,
	FormOptionsProvider,
} from '@conform-to/react/future';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
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

// Define custom metadata properties that matches the type of our custom form components
function defineCustomMetadata<FieldShape, ErrorShape>(
	metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
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
		get comboboxProps() {
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
