# @conform-to/validitystate

> 現在のバージョンは、 Conform の React アダプターと互換性がありません。

検証属性に基づくサーバー検証のための [Conform](https://github.com/edmundhung/conform) ヘルパーです。

### parse

制約に基づいてサーバー上で FormData または URLSearchParams を解析し、オプショナルなエラーフォーマッターを使用する関数です。

```ts
import { type FormConstraints, type FormatErrorArgs, parse } from '@conform-to/validitystate';

const constraints = {
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    remember: { type: 'checkbox' },
} satisify FormConstraints;

function formatError({ input }: FormatErrorArgs) {
    switch (input.name) {
        case 'email': {
            if (input.validity.valueMissing) {
                return 'Email is required';
            } else if (input.validity.typeMismatch) {
                return 'Email is invalid';
            }
            break;
        }
        case 'password': {
            if (input.validity.valueMissing) {
                return 'Password is required';
            }
            break;
        }
     }

     return '';
}

const submission = parse(formData, {
  constraints,
  formatError,
});

// エラーは、入力名を対応するエラーにマッピングする辞書になります。
// 例: { email: 'Email is required', password: 'Password is required' }
console.log(submission.error);

if (!submission.error) {
    // エラーがない場合、推論された型を持つ解析されたデータが利用可能になります。
    // 例: { email: string; password: string; remember: boolean; }
    console.log(submission.value);
}
```

エラーフォーマッターは、複数のエラーも返すことができます。

```ts
function formatError({ input }: FormatErrorArgs) {
  const error = [];

  switch (input.name) {
    case 'email': {
      if (input.validity.valueMissing) {
        error.push('Email is required');
      }
      if (input.validity.typeMismatch) {
        error.push('Email is invalid');
      }
      break;
    }
    case 'password': {
      if (input.validity.valueMissing) {
        error.push('Password is required');
      }
      if (input.validity.tooShort) {
        error.push('Password is too short');
      }
      break;
    }
  }

  return error;
}
```

エラーフォーマッターが提供されていない場合は、デフォルトの挙動について [defaultFormatError](#defaultformaterror) ヘルパーをチェックしてください。

### validate

クライアントのバリデーションをカスタマイズするために、制約とエラーフォーマッターを再利用するヘルパーです。エラーは `setCustomValidity` メソッドを使用してフォームコントロール要素に設定されます。新しいエラーを報告する前（つまり、 `form.reportValidity()` をトリガーする前）に呼び出すべきです。

```tsx
import { validate } from '@conform-to/validitystate';

function Example() {
  return (
    <form
      onSubmit={(event) => {
        const form = event.currentTarget;

        // 新しいエラーを報告する前にバリデートします。
        validate(form, {
          constraints,
          formatError,
        });

        if (!form.reportValidity()) {
          event.preventDefault();
        }
      }}
      noValidate
    >
      {/* ... */}
    </form>
  );
}
```

### defaultFormatError

これは、 [parse](#parse) によって全ての失敗したバリデーション属性によるエラーを表すために使用されるデフォルトのエラーフォーマッターです。例えば:

```json
{ "email": ["required", "type"], "password": ["required"] }
```

このヘルパーは、デフォルトのエラーフォーマッターに基づいてエラーをカスタマイズしたい場合に役立ちます。

```ts
import { type FormConstraints, type FormatErrorArgs, defaultFormatError } from '@conform-to/validitystate';

const constraints = {
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    confirmPassowrd: { type: 'password', required: true },
} satisify FormConstraints;

function formatError({ input }: FormatErrorArgs<typeof constraints>) {
    const error = defaultFormatError({ input });

    if (input.name === 'confirmPassword' && error.length === 0 && value.password !== value.confirmPassword) {
        error.push('notmatch');
    }

    return error;
}

const submission = parse(formData, {
    constraints,
    formatError,
});
```

### getError

実際のエラーメッセージは `validationMessage` プロパティに保存されます。これは、カスタムエラーフォーマッターが複数のエラーを返す場合に必要です。

```tsx
import { getError } from '@conform-to/validitystate';

function Example() {
  const [error, setError] = useState({});

  return (
    <form
      onInvalid={(event) => {
        const input = event.target as HTMLInputElement;

        setError((prev) => ({
          ...prev,
          [input.name]: getError(input.validationMessage),
        }));

        event.preventDefault();
      }}
    >
      {/* ... */}
    </form>
  );
}
```

## サポートされる属性

> `month` および `week` の入力タイプは、ブラウザのサポートが限られているため実装されていません。

| サポート       | type | required | minLength | maxLength | pattern | min | max | step | multiple |
| :------------- | :--: | :------: | :-------: | :-------: | :-----: | :-: | :-: | :--: | :------: |
| text           |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |
| email          |  🗸   |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |
| password       |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |
| url            |  🗸   |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |
| tel            |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |
| search         |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |
| datetime-local |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |
| date           |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |
| time           |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |
| select         |      |    🗸     |           |           |         |     |     |      |    🗸     |
| textarea       |      |    🗸     |     🗸     |     🗸     |         |     |     |      |
| radio          |      |    🗸     |           |           |         |     |     |      |
| color          |      |    🗸     |           |           |         |     |     |      |
| checkbox       |      |    🗸     |           |           |         |     |     |      |
| number         |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |
| range          |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |
| file           |      |    🗸     |           |           |         |     |     |      |    🗸     |
