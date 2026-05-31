# seat-luck-compass

`seat-luck-compass` 是一个基于 `Next.js + TypeScript + Tailwind CSS` 的 H5 网页项目，用于生成“今日座位罗盘”建议卡。

## 功能

- 首页、表单页、环境页、结果页四段式流程
- 结果页根据输入生成推荐座位、不建议座位、入场建议、收手提醒与评分依据
- 明亮清晰的移动端卡片风格，适合手机浏览
- 支持一键生成分享图并保存为图片
- 支持上传座位图，调用多模态模型返回“原图标识结果”
- 支持图片上传隐私提示、大小校验、超时与失败兜底
- 支持输入提示词，调用 Kie 图片接口生成图片并回传到 H5
- 使用 `localStorage` 保存最近 5 次测试记录
- 可选接入 `Supabase`，把测试结果和海报任务状态存到后台
- 不需要登录，不需要数据库

## 本地运行

```bash
npm install
cp .env.example .env.local
# 在 .env.local 中填入 KIE_API_KEY
# 如需后台留存，再补 SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 座位图海报功能说明

- 页面路径：`/analyze`
- 需要配置 `KIE_API_KEY`
- 建议同时配置 `NEXT_PUBLIC_SITE_URL`，用于分享 metadata
- 会保留前面表单里填写过的生肖、月份、状态、目的
- 上传真实座位照片后，先返回带框和标签的原图标识结果
- 在标识结果基础上，可继续调用 Kie 图生图接口生成类似“推荐座位海报”的成品图
- 仅分析可见空间信息、动线、采光、入口干扰、靠墙感和视线舒适度
- 不涉及赌博、输赢预测、下注或任何承诺性判断
- 图片仅建议用于本次分析，请尽量不要上传包含人脸、联系方式或其他敏感信息的照片

## Kie 图片生成功能说明

- 页面路径：`/generate`
- 需要配置 `KIE_API_KEY`
- 当前接入的是 Kie 的 `4o Image API`
- 调用方式是服务端创建异步任务，再由前端轮询任务状态并回传图片结果
- 当前先支持文本提示词生成，后续可以继续扩成参考图编辑

## 生产构建

```bash
npm run build
npm run start
```

## Supabase 数据留存

如果你想在后台查看用户提交记录，可以接入 `Supabase`：

1. 在 Supabase 的 SQL Editor 运行：
   - [supabase/schema.sql](/Users/mac/Documents/Playground/seat-luck-compass/supabase/schema.sql)
2. 在环境变量中新增：
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - 可选：`SUPABASE_SERVICE_ROLE_KEY`
3. 重新部署后，新的用户提交会自动写入两张表：
   - `submissions`
   - `poster_jobs`

查看位置：
- Supabase `Table Editor -> submissions`
- Supabase `Table Editor -> poster_jobs`

其中：
- `submissions` 记录每次结果卡生成时的输入和输出
- `poster_jobs` 记录环境图海报任务 ID、状态和生成结果

## 上线前核对清单

- 在 `.env.local` 或部署平台中配置：
  - `KIE_API_KEY`
  - `KIE_API_BASE_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - 可选：`SUPABASE_URL`
  - 可选：`SUPABASE_PUBLISHABLE_KEY`
- 本地执行一次 `npm run build`，确认构建通过
- 真机测试完整流程：
  - 首页 -> 表单页 -> 环境页 -> 结果页
  - 环境图上传
  - 原图标识
  - 推荐海报生成
  - 分享图保存
- 检查隐私说明页与使用说明页是否可访问：
  - `/privacy`
  - `/notice`
- 检查站点级资源是否可访问：
  - `/manifest.webmanifest`
  - `/robots.txt`
  - `/sitemap.xml`
- 给测试用户的提示建议：
  - 尽量上传能拍到座位、门口、窗边与主要通道的完整环境图
  - 不要上传包含人脸、联系方式、收款码等敏感信息的图片
- 上线前确认 Kie key 没有写死在仓库里，只保存在环境变量中

## 部署到 Vercel

1. 把项目推到 GitHub。
2. 登录 [Vercel](https://vercel.com/)。
3. 点击 `Add New` -> `Project`。
4. 选择你的 `seat-luck-compass` 仓库并导入。
5. Framework Preset 选择 `Next.js`。
6. 在 Vercel 的 Environment Variables 中添加：
   - `KIE_API_KEY`
   - `KIE_API_BASE_URL`（可选）
   - `NEXT_PUBLIC_SITE_URL`（建议填成线上域名，便于分享卡片）
7. 点击 `Deploy`，等待构建完成。
8. 发布后即可获得线上地址。

更细的部署步骤可以看 [DEPLOY_VERCEL.md](/Users/mac/Documents/Playground/seat-luck-compass/DEPLOY_VERCEL.md)。

## 项目结构

```text
app/             页面路由与全局样式
components/      复用组件
lib/             类型、规则逻辑与 localStorage 封装
```
