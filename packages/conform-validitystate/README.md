# @conform-to/validitystate

Validate on the server using the same rules as the browser

## Status

> `month` and `week` inputs are not implemented due to limited browser support

| Support        | type | required | minLength | maxLength | pattern | min | max | step | multiple |
| :------------- | :--: | :------: | :-------: | :-------: | :-----: | :-: | :-: | :--: | :------: |
| text           |      |    🟢    |    🟢     |    🟢     |   🟢    |     |     |      |          |
| email          |  🟢  |    🟢    |    🟢     |    🟢     |   🟢    |     |     |      |          |
| password       |      |    🟢    |    🟢     |    🟢     |   🟢    |     |     |      |          |
| url            |  🟢  |    🟢    |    🟢     |    🟢     |   🟢    |     |     |      |          |
| tel            |      |    🟢    |    🟢     |    🟢     |   🟢    |     |     |      |          |
| search         |      |    🟢    |    🟢     |    🟢     |   🟢    |     |     |      |          |
| datetime-local |      |    🟢    |           |           |         | 🟢  | 🟢  |  🟢  |          |
| date           |      |    🟢    |           |           |         | 🟢  | 🟢  |  🟢  |          |
| time           |      |    🟢    |           |           |         | 🟢  | 🟢  |  🟢  |          |
| select         |      |    🟢    |           |           |         |     |     |      |    🟢    |
| textarea       |      |    🟢    |    🟢     |    🟢     |         |     |     |      |          |
| radio          |      |    🟢    |           |           |         |     |     |      |          |
| color          |      |    🟢    |           |           |         |     |     |      |          |
| checkbox       |      |    🟢    |           |           |         |     |     |      |          |
| number         |      |    🟢    |           |           |         | 🟢  | 🟢  |  🟢  |          |
| range          |      |    🟢    |           |           |         | 🟢  | 🟢  |  🟢  |          |
| file           |      |    🟢    |           |           |         |     |     |      |    🟢    |
