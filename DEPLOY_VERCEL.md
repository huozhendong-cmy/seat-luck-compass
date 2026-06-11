# Vercel 部署说明

这份说明适合把 `seat-luck-compass` 作为一个公开可访问的 H5 项目部署到 Vercel。

## 1. 本地确认

先在本地确认这几件事：

```bash
cd /Users/mac/Documents/Playground/seat-luck-compass
npm install
npm run build
```

如果构建通过，再继续下一步。

## 2. 准备环境变量

部署时至少需要这些变量：

- `KIE_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_KEY`

可选变量：

- `KIE_API_BASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `INITIAL_FREE_CREDITS`
- `NEXT_PUBLIC_WECHAT_QR_URL`
- `NEXT_PUBLIC_WECHAT_ID`
- `NEXT_PUBLIC_WECHAT_CONTACT_NOTE`
- `ALIYUN_SMS_ACCESS_KEY_ID`
- `ALIYUN_SMS_ACCESS_KEY_SECRET`
- `ALIYUN_SMS_SIGN_NAME`
- `ALIYUN_SMS_TEMPLATE_CODE`
- `ALIYUN_SMS_ENDPOINT`
- `ALIYUN_SMS_REGION_ID`
- `SMS_CODE_TTL_SECONDS`
- `SMS_RESEND_COOLDOWN_SECONDS`

建议填写方式：

- `KIE_API_KEY`：你的正式可用 key
- `NEXT_PUBLIC_SITE_URL`：上线后的正式域名，例如 `https://seat-luck-compass.vercel.app`
- `KIE_API_BASE_URL`：通常保留默认 `https://api.kie.ai`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`：Supabase 项目地址和服务端密钥
- `ADMIN_DASHBOARD_KEY`：你自己掌握的后台密钥，用来打开 `/dashboard?key=你的密钥`
- `INITIAL_FREE_CREDITS`：新用户初始免费额度，默认 `12`
- `NEXT_PUBLIC_WECHAT_QR_URL`：用户额度用完后弹窗展示的微信二维码图片地址
- `NEXT_PUBLIC_WECHAT_ID`：弹窗中展示的微信号
- `NEXT_PUBLIC_WECHAT_CONTACT_NOTE`：弹窗里的补充说明文案

短信变量这版已经保留接入能力，但如果你当前走“游客试用 + 微信人工补赠”的模式，可以先不配置短信。

如果将来重新启用短信登录，正式环境不要再保留开发联调模式的验证码回显，`MOCK_SMS_CODE` 只建议本地开发时使用。

## 3. 推到 GitHub

如果这个项目还没有单独推到 GitHub，可以在项目目录执行：

```bash
git init
git add .
git commit -m "Initial launch-ready version"
```

然后在 GitHub 新建仓库，再关联并推送：

```bash
git remote add origin <你的仓库地址>
git branch -M main
git push -u origin main
```

## 4. 在 Vercel 导入项目

1. 登录 [Vercel](https://vercel.com/)
2. 点击 `Add New` -> `Project`
3. 选择 GitHub 上的 `seat-luck-compass`
4. Framework Preset 选择 `Next.js`
5. 打开 Environment Variables，填入：
   - `KIE_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `KIE_API_BASE_URL`（可选）
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_DASHBOARD_KEY`
   - `INITIAL_FREE_CREDITS`
   - `NEXT_PUBLIC_WECHAT_QR_URL`
   - `NEXT_PUBLIC_WECHAT_ID`
   - `NEXT_PUBLIC_WECHAT_CONTACT_NOTE`
6. 点击 `Deploy`

## 5. 部署完成后检查

上线后建议马上检查：

- 首页是否正常显示
- `/notice` 是否可访问
- `/privacy` 是否可访问
- `/manifest.webmanifest` 是否可访问
- `/robots.txt` 是否可访问
- `/sitemap.xml` 是否可访问
- 表单 -> 环境 -> 结果页流程是否正常
- 游客首次进入是否自动获得免费额度
- 环境图上传是否正常
- 原图标识是否正常
- 海报生成是否正常
- 额度耗尽时是否弹出微信二维码和 UID
- `/dashboard?key=你的密钥` 是否可以正常手动补赠额度

## 6. 建议的真机回归

用手机真实测试一次：

1. 首页打开速度
2. 表单交互是否顺手
3. 上传图片是否能正常唤起系统相册
4. 图片过大时是否有清晰提示
5. 海报生成失败时是否有兜底提示
6. 分享图下载是否成功

## 7. 上线后注意点

- 不要把 `.env.local` 提交到仓库
- 如果 Kie key 已经在公开聊天里出现过，建议去后台换一个新 key
- 如果未来要做微信小程序或抖音小程序，建议把当前 H5 版本作为视觉和逻辑原型，再迁移到小程序工程
