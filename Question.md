# 常见问题

## java-server

### 使用 idea 本地开发 maven 打包编译报错 `“无效的标记: --release”`

> 请查看 idea 的 maven 配置中的 `导入程序的 JDK` 以及 `运行程序的 JRE` 是否都是 JDK 17 及以上版本，建议设置成 `Project SDK`

### Error attempting to get column 'create_time' from result set.  Cause: java.sql.SQLFeatureNotSupportedException

> [LocalDateTime 类型不兼容问题](https://github.com/alibaba/druid/issues/3302)，若使用 Druid 数据源，需要升级到 [1.2.21](https://github.com/alibaba/druid/releases/tag/1.1.21) 或以上版本

### com.amazonaws.SdkClientException: Unable to execute HTTP request: endpoint `java.net.UnknownHostException: endpoint`

> 请检查 `amazon.s3.with-path-style-access` 以及 `amazon.s3.endpoint` 配置是否正确，注意区分虚拟主机模式和路径模式
> - 虚拟主机模式：`https://{bucket-name}.s3.amazonaws.com/{object-key}`
> - 路径模式：`https://s3.amazonaws.com/{bucket-name}/{object-key}`

## website

### `pnpm install` 后 `ERR_PNPM_FETCH_404`  GET https://registry.npmmirror.com/@volar/typescript/-/typescript-1.10.1.tgz: Not Found - 404

> 尝试删除本地 pnpm-lock.yaml 文件后再次 pnpm install