# Setup and development 设置和开发

- [Setup and development 设置和开发](#setup-and-development-设置和开发)
  - [First-time setup](#first-time-setup)
  - [Installation](#installation)
    - [Database](#database)
    - [Configuration](#configuration)
    - [Dev server](#dev-server)
  - [Generators](#generators)

## First-time setup

确认已安装:

- [Node](https://nodejs.org/en/) (at least the latest LTS)
- [Yarn](https://yarnpkg.com/lang/en/docs/install/) (at least 1.0)

## Installation

```bash
# Install dependencies from package.json
yarn i
```

> 注意: 不要 yarn.lock 以免版本兼容问题

### Database

> 案例使用 `sqlite` 具体请根据需要,自行修改。

### Configuration

修改配置文件 `config.development.ts` 以及 `databases/config.json`

一些数据库的迁移脚本  

详情访问 [sequelize-cli](https://github.com/sequelize/cli)

```bash
# 创建数据库迁移文件
yarn migrate:new -- --name migration_name

# 清空数据库 并且 重新导入迁移文件
yarn migrate:rest
```

### Dev server

```bash
# Launch the dev server
yarn start:dev

# Launch the dev server with file watcher
yarn watch:dev

# Launch the dev server and enable remote debugger with file watcher
yarn debug:dev
```

## Generators

项目手脚架

> 需要全局安装 nest-cli

```bash
# Install nest-cli globally
yarn global add @nestjs/cli

# Generate a new service
nest generate service user

# Generate a new class
nest g class user

```

> [Nest-cli 文档](https://docs.nestjs.com/cli/usages#generate-alias-g)
