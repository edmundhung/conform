export function invariant(
	expectedCondition: boolean,
	message: string,
): asserts expectedCondition {
	if (!expectedCondition) {
		throw new Error(message);
	}
}
