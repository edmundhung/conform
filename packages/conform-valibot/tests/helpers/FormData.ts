export function createFormData(key: string, value: string | Blob) {
	const formData = new FormData();
	formData.append(key, value);
	return formData;
}
