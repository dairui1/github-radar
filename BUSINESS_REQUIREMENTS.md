# GitHub Radar - 业务场景理解和技术方案

## 业务场景理解

### 核心需求
- **目标用户**: 开发者、技术团队、开源项目维护者
- **核心痛点**: 需要手动关注多个GitHub项目的动态，信息分散且难以快速获取关键信息
- **解决方案**: 自动化监控、智能总结、集中展示

### 业务流程
1. **项目添加**: 用户通过移动端Web界面添加需要监控的GitHub仓库URL
2. **数据采集**: 系统定时抓取指定仓库的Issues和Discussions更新
3. **智能分析**: 利用LLM对抓取的内容进行分析和总结
4. **报告生成**: 生成结构化的日报/周报，突出关键信息
5. **内容展示**: 通过Web界面展示报告，支持移动端访问

### 功能特性
- **多仓库管理**: 支持添加、删除、编辑监控的GitHub仓库
- **定时监控**: 可配置的定时任务，支持每日/每周等频率
- **智能总结**: LLM驱动的内容总结，提取关键信息
- **移动优先**: 响应式设计，优化移动端体验
- **数据持久化**: 历史数据存储，支持趋势分析

## 技术方案架构

### 技术栈选择
- **前端框架**: Next.js 14 (App Router)
- **UI组件**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite (轻量化部署) 或 PostgreSQL
- **ORM**: Prisma
- **LLM集成**: Vercel AI SDK
- **定时任务**: node-cron 或 Next.js API Routes + 外部调度
- **GitHub API**: Octokit.js
- **部署**: Docker + VPS

### 系统架构设计

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   移动端Web界面   │────│   Next.js应用     │────│   GitHub API    │
│   (添加监控项目)  │    │   (前后端一体)     │    │   (数据源)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   数据库存储      │
                       │   (项目/报告)     │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   定时任务调度    │────│   LLM服务       │
                       │   (数据采集)      │    │   (内容总结)    │
                       └──────────────────┘    └─────────────────┘
```

### 数据模型设计

```typescript
// 监控项目表
interface Project {
  id: string
  name: string
  githubUrl: string
  owner: string
  repo: string
  isActive: boolean
  lastSyncAt: Date
  createdAt: Date
  updatedAt: Date
}

// 报告表
interface Report {
  id: string
  projectId: string
  title: string
  content: string
  summary: string
  reportType: 'daily' | 'weekly'
  reportDate: Date
  issuesCount: number
  discussionsCount: number
  createdAt: Date
}

// 原始数据表
interface RawData {
  id: string
  projectId: string
  type: 'issue' | 'discussion'
  githubId: number
  title: string
  body: string
  author: string
  createdAt: Date
  syncedAt: Date
}
```

### API设计

```typescript
// RESTful API 设计
GET    /api/projects              // 获取监控项目列表
POST   /api/projects              // 添加新的监控项目
PUT    /api/projects/:id          // 更新项目信息
DELETE /api/projects/:id          // 删除项目

GET    /api/reports               // 获取报告列表
GET    /api/reports/:id           // 获取特定报告详情
POST   /api/sync/:projectId       // 手动触发同步

POST   /api/cron/sync             // 定时任务端点
```

### 部署方案
1. **容器化**: Docker构建镜像
2. **数据持久化**: 挂载数据卷存储数据库文件
3. **环境变量**: 配置GitHub Token、LLM API密钥等
4. **反向代理**: Nginx处理HTTPS和域名
5. **监控**: 基础的健康检查和日志

### 开发阶段规划
1. **Phase 1**: 基础框架搭建 + 数据模型
2. **Phase 2**: GitHub API集成 + 数据采集
3. **Phase 3**: LLM集成 + 报告生成
4. **Phase 4**: 前端界面开发
5. **Phase 5**: 定时任务 + 部署配置

### 风险评估
- **API限制**: GitHub API有速率限制，需要合理控制请求频率
- **成本控制**: LLM API调用成本，需要优化prompt和缓存策略
- **数据量**: 大量项目监控时的性能优化
- **错误处理**: 网络异常、API失效等异常情况处理

## 预期交付物
- 可部署的Next.js应用
- 完整的数据库模式
- 移动端优化的Web界面
- 自动化的监控和报告系统
- 部署文档和配置文件