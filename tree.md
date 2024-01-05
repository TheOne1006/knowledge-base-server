nestjs-rest-api-boilerplate-2
├─.editorconfig
├─.prettierrc
├─.sequelizerc
├─README.md
├─README_zh.md
├─tree.md
├─yarn.lock
├─test
├─src
|  ├─app.controller.ts
|  ├─main.ts
|  ├─users
|  |   ├─users.controller.ts
|  |   ├─dtos
|  |   |  └index.ts
|  ├─i18n
|  |  ├─zh-cn
|  |  ├─en
|  ├─core
|  |  ├─logger
|  |  |   └index.ts
|  |  ├─interceptors
|  |  |      ├─index.ts
|  |  |      ├─__tests__
|  |  ├─i18n
|  |  |  └index.ts
|  |  ├─filters
|  |  |    ├─index.ts
|  |  |    ├─__tests__
|  |  ├─database
|  |  |    └index.ts
|  ├─common
|  |   ├─interfaces
|  |   |     ├─index.ts
|  |   |     └request-user.interface.ts
|  |   ├─interceptors
|  |   |      ├─__tests__
|  |   ├─decorators
|  |   |     ├─index.ts
|  |   |     ├─__tests__
|  |   |     |     ├─__mocks__
|  |   |     |     |     └file1
|  |   ├─constants
|  |   |     └index.ts
|  |   ├─auth
|  |   |  ├─auth.middleware.ts
|  |   |  ├─index.ts
|  |   |  ├─roles.guard.ts
|  |   |  ├─__tests__
├─docs
|  ├─architecture.md
|  ├─architecture_zh.md
|  ├─development.md
|  └development_zh.md
├─databases
|     ├─migrations
|     ├─db
├─config
|   ├─config.default.ts
|   ├─config.development.ts
|   ├─config.production.ts
|   ├─config.unittest.ts
|   └index.ts
├─.vscode