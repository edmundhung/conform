export function invariant(
	expectedCondition: boolean,
	message: string,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw new Error(message);
	}
}

export function generateId(): string {
	return (Date.now() * Math.random()).toString(36);
}
