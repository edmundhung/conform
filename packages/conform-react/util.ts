export function normalizeFieldValue(
	value: string | string[] | File | File[] | null | undefined,
): string[] | File[] | null {
	if (typeof value === 'undefined' || value === null) {
		return null;
	}

	if (Array.isArray(value)) {
		return value;
	}

	return [value] as string[] | File[];
}

export function setVisuallyHidden(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	element.style.position = 'absolute';
	element.style.width = '1px';
	element.style.height = '1px';
	element.style.padding = '0';
	element.style.margin = '-1px';
	element.style.overflow = 'hidden';
	element.style.clip = 'rect(0,0,0,0)';
	element.style.whiteSpace = 'nowrap';
	element.style.border = '0';
	element.tabIndex = -1;
}
