# Custom Validation Example

> Preview: [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/v0.3.0/examples/custom-validation) \| [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/v0.3.0/examples/custom-validation)

This example shows you how to customize the validation messages and add custom constraint using the `createValidate()` helper. This includes accessing the validity of the fields by checking its [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState) and also configuring the fields throguh the [setCustomValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity) API.

## Related APIs

- [useForm](../../packages/conform-react/README.md#useForm)
- [useFieldset](../../packages/conform-react/README.md#useFieldset)
- [createValidate](../../packages/conform-react/README.md#createValidate)
