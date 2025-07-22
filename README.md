# 编译

## 编译为本地测试
合约地址: `45iBNkaENereLKMjLm2LHkF3hpDapf6mnvrM5HWFg9cY`
超级管理员（EOA地址）: `Fh3a8NURkS4ihZjbsMvtFB4T2GGqs4FgLXSVw6nMexRN`
其中超级管理员对应的私钥是 `localnet-admin-keypair.json` 文件
```
./build.sh local
```

## 编译为dev环境(test5使用)
合约地址: `45iBNkaENereLKMjLm2LHkF3hpDapf6mnvrM5HWFg9cY`
超级管理员地址(测试用多签地址): `9ZG4mYtayKedcDkRbpGAc13uQDT2Ag9twJBbuwia9Lqg`
```
./build.sh dev
```

## 编译为生产环境
合约地址: `REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2`
超级管理员地址: `AY196f8U5EvM999PVnvLmyvaUnzL4GLiFaGKUgnJXN6o`
```
./build.sh mainnet
```
编译为生产环境的合约后，`./idl`目录下同时会包含最新的idl文件。


# 执行单元测试

注意： 要运行单元测试，必须要按 “编译为本地测试” 方式进行编译。

step1. 编译为本地测试；
step2. 启动本地验证节点
```
cd ./tests/xStockTest
./start_validator.sh

```
step3. 运行单元测试
```
cd ./tests/xStockTest
./run_tests.sh
```