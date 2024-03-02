# getCollectionProps

チェックボックスまたはラジオボタンのグループをアクセシブルにするために必要なすべてのプロパティを返すヘルパーです。

```tsx
const collectionProps = getCollectionProps(meta, options);
```

## 例

```tsx
import { useForm, getCollectionProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <>
      {getCollectionProps(fields.color, {
        type: 'radio',
        options: ['red', 'green', 'blue'],
      }).map((props) => (
        <label key={props.id} htmlFor={props.id}>
          <input {...props} />
          <span>{props.value}</span>
        </label>
      ))}
    </>
  );
}
```

## オプション

### `type`

コレクションのタイプです。 **checkbox** （チェックボックス）または **radio** （ラジオボタン）のいずれかになります。

### `options`

コレクションのオプションです。各オプションは入力の値として扱われ、対応する **key** または **id** を導出するために使用されます。

### `value`

このヘルパーは、例えばコントロールされた入力のように、これが `false` に設定されていない限り、 **defaultValue** を返します。

### `ariaAttributes`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaInvalid`

ARIA 属性が `meta.errors` または `meta.allErrors` に基づくべきかどうかを決定します。デフォルトは **errors** です。

### `ariaDescribedBy`

`aria-describedby` 属性に追加の **id** を付加します。フィールドメタデータから `meta.descriptionId` を渡すことができます。

## 例

### ヘルパーは任意です

このヘルパーは、定型文を減らし、読みやすくするための便利な機能です。チェックボックス要素のプロパティを設定するために、いつでもフィールドメタデータを直接使用することができます。

```tsx
// Before
function Example() {
  return (
    <form>
      {['a', 'b', 'c'].map((value) => (
        <label key={value} htmlFor={`${fields.category.id}-${value}`}>
          <input
            type="checkbox"
            key={`${fields.category.key}-${value}`}
            id={`${fields.category.id}-${value}`}
            name={fields.category.name}
            form={fields.category.formId}
            value={value}
            defaultChecked={fields.category.initialValue?.includes(value)}
            aria-invalid={!fields.category.valid || undefined}
            aria-describedby={
              !fields.category.valid ? fields.category.errorId : undefined
            }
          />
          <span>{value}</span>
        </label>
      ))}
      x
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      {getCollectionProps(fields.category, {
        type: 'checkbox',
        options: ['a', 'b', 'c'],
      }).map((props) => (
        <label key={props.id} htmlFor={props.id}>
          <input {...props} />
          <span>{props.value}</span>
        </label>
      ))}
    </form>
  );
}
```

### 自分のヘルパーを作る

このヘルパーは、ネイティブのチェックボックス要素用に設計されています。カスタムコンポーネントを使用する必要がある場合は、自分自身のヘルパーを作成することができます。
