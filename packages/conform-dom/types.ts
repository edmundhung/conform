export type FieldConstraint<Schema = any> = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: Schema extends number ? number : string | number;
	max?: Schema extends number ? number : string | number;
	step?: Schema extends number ? number : string | number;
	multiple?: boolean;
	pattern?: string;
};

export type FieldsetConstraint<Schema extends Record<string, any>> = {
	[Key in keyof Schema]?: FieldConstraint<Schema[Key]>;
};
