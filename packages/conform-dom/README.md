# @conform-to/dom

> This package is a transitive dependency for the rest of the conform packages with no intention to be used directly at the moment. Use at your own risk.

Conform is a form validation library built on top of the [Constraint Validation](https://caniuse.com/constraint-validation) API.

- **Progressive Enhancement**: It is designed based on the [HTML specification](https://html.spec.whatwg.org/dev/form-control-infrastructure.html#the-constraint-validation-api). From validating the form to reporting error messages for each field, if you don't like part of the solution, just replace it with your own.
- **Framework Agnostic**: The DOM is the only dependency. Conform makes use of native [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) exclusively. You don't have to use React / Vue / Svelte to utilise this library.
- **Flexible Setup**: It can validates fields anywhere in the dom with the help of [form attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form). Also enables CSS pseudo-classes like `:valid` and `:invalid`, allowing flexible styling across your form without the need to manipulate the class names.

Checkout the [repository](https://github.com/edmundhung/conform) if you want to know more!
