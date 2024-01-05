# 单元测试

> 执行
```bash
yarn migrate:up --env test # 初始化 db

yarn test # 启动测试

yarn test:cov # 覆盖率

yarn test:cov:report # 生成覆盖率测试报告, 位于根目录的 /coverage
```

## 编写新的单元测试

1. 文件以 `spec.ts` 结尾
2. 单元放置于 `__tests__` 文件中


> Tips: 基于依赖注入和 mock 上下文的方式，可以方便的只关注于模块的测试



# e2e test

> 执行
```bash
yarn test:e2e # 启动e2e测试
```

## 编写新的端到端测试

1. 文件以 `e2e-spec.ts` 结尾
2. 单元放置于 `__e2e__` 文件中



