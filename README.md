# 社团网站内容管理后台

这是一个基于 Next.js 和 Payload CMS 的社团网站。公众不需要账号；管理员和编辑可进入 `/admin` 协作维护内容。本地默认使用 SQLite，正式环境支持 PostgreSQL。

## 已有内容模块

- 文章与推文：支持站内正文或外部原文链接、分类、封面、草稿和定时发布
- 活动：支持时间、地点、正文、照片集和相关链接
- 网站与资源链接：支持分类、排序和启用/停用
- 媒体库：支持图片和 PDF
- 网站设置：社团名称、口号、简介、Logo、邮箱和加入链接
- 账号协作：管理员可管理账号和全部内容，编辑可维护内容及自己的账号

## 本地运行

需要 Node.js 20.9 或更高版本，以及 pnpm。

在当前 Windows 电脑上，可以直接双击项目根目录中的 `启动后台.cmd`。脚本会自动启动服务，并在后台就绪后打开管理页面。请保持启动窗口打开，关闭窗口或按 `Ctrl+C` 会停止后台。

```powershell
pnpm install
Copy-Item .env.example .env
pnpm dev
```

打开 `http://localhost:3000/admin`。数据库为空时，页面会引导创建第一个管理员。

本地内容保存在 `club-cms.db`，上传文件保存在 `media`，两者都不会提交到 Git。生产部署前应将数据库切换为 PostgreSQL，并将媒体文件切换到对象存储。

## 正式数据库与邮件

复制 `.env.example` 为 `.env`，并至少生成一个高强度 `PAYLOAD_SECRET`。本地运行时保持：

```dotenv
DATABASE_TYPE=sqlite
DATABASE_URL=file:./club-cms.db
PAYLOAD_DB_PUSH=false
```

正式环境改为 PostgreSQL：

```dotenv
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://用户名:密码@数据库主机:5432/数据库名
NEXT_PUBLIC_SERVER_URL=https://你的正式域名
```

项目附带的 `docker-compose.yml` 可启动一套本地 PostgreSQL。先在 `.env` 中填写 `POSTGRES_PASSWORD`，再执行 `docker compose up -d postgres`。正式环境应先创建并审查迁移，然后执行迁移：

```powershell
pnpm payload:migrate:create
pnpm payload:migrate
pnpm payload:migrate:status
```

SQLite 和 PostgreSQL 是两个独立数据库，切换连接不会自动复制旧内容。正式上线前应安排一次明确的数据迁移或在新数据库重新录入内容。

为避免开发服务器并发初始化时重复创建 SQLite 索引，本地默认关闭自动结构推送。以后修改后台内容模型时，可临时设置 `PAYLOAD_DB_PUSH=true`，单独启动一次服务完成同步，确认后再改回 `false`。

填写 `SMTP_HOST`、`SMTP_USER`、`SMTP_PASS` 等环境变量后，后台可通过 SMTP 发送账号密码重置邮件。未填写时，本地仍可正常运行，但邮件只会记录到控制台。

管理员可在“管理员”模块创建编辑账号。新账号默认角色为“编辑”；只有管理员能新增、删除账号或修改角色。首个初始化账号会自动设为管理员。

## 基础安全设置

项目限制了登录失败次数、数据库查询深度、跨站请求来源和浏览器敏感能力，并在响应中加入防点击劫持、禁止 MIME 猜测等安全响应头。当前前台不使用 GraphQL，因此该接口默认关闭。正式域名必须填写到 `NEXT_PUBLIC_SERVER_URL`；若后台和前台分属不同域名，再通过 `ALLOWED_ORIGINS` 添加可信来源。

## Railway 部署

本项目推荐使用 Railway 托管。根目录中的 `Dockerfile` 会被 Railway 自动识别，`/api/health` 用于发布健康检查。

1. 将项目提交到 GitHub 仓库。
2. 在 Railway 创建空项目，通过 GitHub Repo 添加网站服务。
3. 在同一项目中选择 Database → PostgreSQL。
4. 在网站服务的 Variables 中配置：

```dotenv
DATABASE_TYPE=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
PAYLOAD_SECRET=至少32位的随机字符串
PAYLOAD_DB_PUSH=true
NEXT_PUBLIC_SERVER_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

5. 在网站服务的 Networking 中生成 Railway 域名。
6. 在 Deploy 设置中将 Healthcheck Path 设为 `/api/health`，超时设为 300 秒。
7. 首次发布成功并创建完数据库表后，把 `PAYLOAD_DB_PUSH` 改为 `false` 并重新部署。后续数据库结构变化使用迁移文件，不再自动修改正式库。

SMTP 变量可以在网站正常上线后补充。由于媒体对象存储步骤目前被暂缓，在完成对象存储或持久卷配置前，不应把后台上传文件作为唯一长期副本。

## 常用命令

```powershell
pnpm dev             # 启动本地开发服务器
pnpm lint            # 检查代码
pnpm generate:types  # 内容模型变化后重新生成类型
pnpm build           # 生产构建
pnpm start           # 运行生产构建
```
