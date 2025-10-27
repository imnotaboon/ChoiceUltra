# FHE Voting DApp 部署说明

## 📦 静态文件构建

前端已成功构建为静态文件，位于 `out/` 目录中。

### 构建信息
- **构建命令**: `npm run build:static`
- **输出目录**: `out/`
- **支持网络**: Sepolia 测试网 (Chain ID: 11155111)
- **合约地址**: `0x259F3E6389cB14047ddC01fe4127A9d13FEd37f1`

## 🚀 部署选项

### 1. 本地测试
```bash
# 使用任何静态文件服务器
npx serve out
# 或
python -m http.server 8000 -d out
```

### 2. 部署到静态托管服务

#### Vercel
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Netlify
1. 将 `out/` 目录拖拽到 Netlify 部署界面
2. 或使用 Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=out
```

#### GitHub Pages
1. 将 `out/` 目录内容推送到 `gh-pages` 分支
2. 在 GitHub 仓库设置中启用 Pages

### 3. 传统 Web 服务器
将 `out/` 目录内容上传到任何支持静态文件的 Web 服务器（Apache、Nginx 等）。

## 🔧 配置说明

### 网络配置
- **Sepolia 测试网**: 使用真实的 FHEVM relayer 服务
- **本地开发**: 使用 mock 模式（需要 Hardhat 节点）

### 环境要求
- 现代浏览器（支持 Web3 和 FHEVM）
- MetaMask 钱包
- Sepolia 测试网 ETH（用于支付 gas 费用）

## 📱 功能特性

- ✅ 创建投票提案
- ✅ 加密投票（支持/反对）
- ✅ 投票结果解密
- ✅ 投票历史查看
- ✅ 中英文切换
- ✅ 响应式设计
- ✅ 深色模式支持

## 🔗 相关链接

- **Sepolia 水龙头**: https://sepoliafaucet.com/
- **合约地址**: `0x259F3E6389cB14047ddC01fe4127A9d13FEd37f1`
- **网络**: Sepolia (Chain ID: 11155111)
