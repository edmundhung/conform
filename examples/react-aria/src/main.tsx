import {
	type BaseErrorShape,
	type BaseMetadata,
	FormOptionsProvider,
} from '@conform-to/react/future';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
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

// Define custom metadata properties that matches the type of our custom form components
function defineCustomMetadata<FieldShape, ErrorShape extends BaseErrorShape>(
	metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
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
}

// Extend the CustomMetadata interface with our UI component props
// This makes the custom metadata available on all field metadata objects
declare module '@conform-to/react/future' {
	interface CustomMetadata<FieldShape, ErrorShape>
		extends Omit<
			ReturnType<typeof defineCustomMetadata<FieldShape, ErrorShape>>,
			'dateRangePickerProps'
		> {
		// Make sure `dateRangePickerProps` is only available when FieldShape has start and end fields
		dateRangePickerProps: FieldShape extends { start: string; end: string }
			? ReturnType<
					typeof defineCustomMetadata<FieldShape, ErrorShape>
				>['dateRangePickerProps']
			: unknown;
	}

	interface CustomTypes {
		errorShape: string;
	}
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
