# GitHub Radar 报告生成改进测试指南

## 已完成的优化

### 1. 扩展数据收集维度
- ✅ 添加了 `getRepositoryStats()` 方法收集 stars、forks、贡献者等指标
- ✅ 添加了 `getRecentActivity()` 方法收集近期活动数据
- ✅ 创建了 `ProjectStats` 模型存储仓库统计信息
- ✅ 在同步任务中集成了统计数据收集

### 2. 优化 AI 提示词
- ✅ 重新设计了提示词结构，包含 8 个详细的分析维度
- ✅ 加入了趋势分析（对比历史数据）
- ✅ 实现了问题聚类功能（按主题分组）
- ✅ 添加了影响评估和风险分析
- ✅ 支持关键指标的 emoji 标识（🔴 Critical, 🟡 Warning, 🟢 Good）

### 3. 实现报告分级
- ✅ 支持 `summary` 和 `detailed` 两种详细级别
- ✅ 概要版报告专注于关键指标和行动项
- ✅ 详细版报告包含完整的分析和建议

### 4. 项目级报告配置
- ✅ 添加了 `reportConfig` 字段到 Project 模型
- ✅ 创建了 `ReportConfig` 类型定义
- ✅ 支持自定义关注领域、指标、偏好设置
- ✅ 实现了配置 API 端点 (`/api/projects/[id]/config`)

### 5. 增强报告数据结构
- ✅ 添加了 `pullRequestsCount` 字段
- ✅ 添加了 `metadata` 字段存储报告元信息
- ✅ 添加了 `highlights` 字段存储关键亮点
- ✅ 添加了 `metrics` 字段存储计算指标

## 测试步骤

### 1. 测试数据收集
```bash
# 触发同步任务
curl -X POST http://localhost:3000/api/cron/sync \
  -H "Authorization: Bearer your_cron_secret"
```

### 2. 测试报告生成（详细版）
```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your_project_id",
    "reportType": "DAILY",
    "detailLevel": "detailed"
  }'
```

### 3. 测试报告生成（概要版）
```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your_project_id",
    "reportType": "DAILY",
    "detailLevel": "summary"
  }'
```

### 4. 测试项目配置
```bash
# 更新配置
curl -X PUT http://localhost:3000/api/projects/your_project_id/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "focusAreas": {
        "security": true,
        "performance": true,
        "documentation": false
      },
      "preferences": {
        "maxIssuesShown": 30,
        "highlightNewContributors": true
      },
      "alerts": {
        "criticalIssueKeywords": ["urgent", "blocker", "security"],
        "minResponseTime": 12
      }
    }
  }'
```

## 预期改进效果

1. **更丰富的数据维度**：报告现在包含仓库统计、贡献者信息、代码活跃度等
2. **更智能的分析**：通过趋势对比、问题聚类、影响评估提供深入洞察
3. **更灵活的展示**：支持概要和详细两种报告格式，满足不同阅读需求
4. **更个性化的内容**：通过项目配置自定义报告关注点和展示偏好
5. **更结构化的数据**：增强的元数据支持更好的报告检索和分析