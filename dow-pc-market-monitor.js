/**
 * Elaine专属个人护理和化妆品市场情报系统
 * GitHub Actions 专用版本
 * 
 * 目标用户：陶氏化学大中国区个人护理和化妆品事业部市场经理
 * 工作内容：新产品开发、定价、渠道策略
 * 
 * 信息范围：
 * - 中国市场为主，兼顾东南亚和欧美市场
 * - 个人护理和化妆品行业动态
 * - 竞争对手、产品创新、原材料、监管、消费者趋势、渠道变化
 * 
 * 推送时间：每周二、周五早上8点
 * 
 * 信息时效性：过去3天（72小时）内发生/发布的市场信息
 * 
 * GitHub Actions 使用说明：
 * - 在仓库 Settings → Secrets and variables → Actions 中配置以下环境变量：
 *   - FEISHU_APP_ID
 *   - FEISHU_APP_SECRET
 *   - FEISHU_GROUP_CHAT_ID
 *   - DOUBAO_API_KEY
 */

const axios = require('axios');
const nodemailer = require('nodemailer');

// ========================================
// 配置区域 - 支持环境变量和本地配置
// ========================================

const FEISHU_CONFIG = {
  // 优先从环境变量读取（GitHub Actions使用），否则使用默认值（本地测试使用）
  APP_ID: process.env.FEISHU_APP_ID || 'cli_a9fde8469cb89bde',
  APP_SECRET: process.env.FEISHU_APP_SECRET || 'HYgtaXvdzfB3ROUL25UNPnQXf2WRFlMj',
  GROUP_CHAT_ID: process.env.FEISHU_GROUP_CHAT_ID || 'oc_956963760a149d1d4c7a307c892b8643',
};

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || 'ff4e24a1-14d2-44f4-8d8e-c71131631f24';

// ========================================
// Email配置
// ========================================

const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.dow.com',  // 陶氏化学企业邮箱SMTP服务器
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 465,     // SMTP端口
  SMTP_USER: process.env.SMTP_USER,                      // 发送邮箱账号（必须配置）
  SMTP_PASS: process.env.SMTP_PASS,                      // 发送邮箱密码（必须配置）
  EMAIL_TO: process.env.EMAIL_TO || 'gxu8@dow.com',      // 收件人邮箱
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER,  // 发件人邮箱
};

// ========================================
// 模型配置
// ========================================

const DOUBAO_MODEL = 'doubao-seed-1-8-251228';

// ========================================
// 工具函数
// ========================================

function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function getDayOfWeek() {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date().getDay()];
}

// ========================================
// 核心功能：搜索个人护理和化妆品市场信息
// ========================================

async function searchMarketNews() {
  console.log('🔍 搜索个人护理和化妆品市场信息（仅限最新）...\n');

  const searchQueries = [
    // ====== 中国市场动态（主市场） ======
    '中国化妆品行业 最新',
    '中国个人护理市场 最新',
    '中国化妆品监管 最新',
    '化妆品原料 最新',
    '硅油 价格 最新',  // 陶氏化学核心产品相关
    
    // ====== 中国品牌动态（国货美妆） ======
    '完美日记 最新',
    '花西子 最新',
    '珀莱雅 最新',
    '薇诺娜 最新',
    '自然堂 最新',
    '毛戈平 最新',
    '润百颜 最新',
    '夸迪 最新',
    '韩束 最新',
    '可复美 最新',
    
    // ====== 全球巨头动态 ======
    '欧莱雅 中国 最新',
    '宝洁 个人护理 最新',
    '联合利华 中国 最新',
    '雅诗兰黛 最新',
    '资生堂 中国 最新',
    
    // ====== 新产品和创新 ======
    '化妆品新品发布 最新',
    '护肤技术 创新 最新',
    '个人护理原料 创新 最新',
    '功效护肤 最新',
    
    // ====== 消费者趋势 ======
    '成分党 化妆品 最新',
    '纯净美妆 最新',
    '抗衰老 趋势 最新',
    '敏感性肌肤 最新',
    
    // ====== 渠道变化 ======
    '化妆品直播 最新',
    '抖音美妆 最新',
    '化妆品私域 最新',
    '小红书 美妆 最新',
    
    // ====== 小红书爆款和热搜 ======
    '小红书 爆款 化妆品 最新',
    '小红书 热搜 护肤 最新',
    '小红书 测评 美妆 最新',
    '小红书 推荐 化妆品 最新',
    '小红书 种草 美妆 最新',
    '小红书 热门 成分 最新',
    
    // ====== 热门成分和新兴品类 ======
    '玻色因 最新',
    '胜肽 护肤 最新',
    '视黄醇 A醇 最新',
    '烟酰胺 最新',
    '重组胶原蛋白 最新',
    '玻尿酸 护肤 最新',
    '早C晚A 最新',
    '油皮护肤 最新',
    '敏感肌护肤 最新',
    '防晒喷雾 最新',
    '美白精华 最新',
    '安瓶护肤 最新',
    
    // ====== 东南亚市场（重要增长市场） ======
    '东南亚 化妆品 最新',
    '印尼 化妆品 最新',
    '泰国 美妆 最新',
    '越南 个人护理 最新',
    
    // ====== 欧美市场趋势（参考） ======
    '美国 美妆趋势 最新',
    '欧洲 化妆品 最新',
    'K-beauty 最新',
  ];

  const allResults = [];

  // 获取当前时间，用于指定搜索时间范围
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 3);
  
  const yesterday8am = new Date(now);
  yesterday8am.setDate(yesterday8am.getDate() - 3);
  yesterday8am.setHours(8, 0, 0, 0);

  const today8am = new Date(now);
  today8am.setHours(8, 0, 0, 0);

  const yesterdayDateStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;
  const todayDateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  
  const timeRange = `${yesterdayDateStr} 08:00 到 ${todayDateStr} 08:00`;
  console.log(`🕐 搜索时间范围：${timeRange}（过去3天）\n`);

  for (const query of searchQueries) {
    try {
      console.log(`🔍 搜索：${query}...`);

      const response = await axios.post(
        'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        {
          model: DOUBAO_MODEL,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的个人护理和化妆品市场信息搜索助手，专注于过滤过时信息。

## 核心原则
1. **只关注信息发生时间**，不是报道时间
2. **严格时间限制**：只返回发生在 ${yesterdayDateStr} 08:00 到 ${todayDateStr} 08:00 之间的市场信息
3. **宁可漏掉，不要错误**：如果不确定信息时间，不包含该信息

## 必须排除的内容
❌ 几天前、几周前、几月前的事件（即使今天报道）
❌ 回顾性报道（如"回顾上周"、"回顾上个月"、"年度总结"等）
❌ 季度、年度、月度数据（即使最近发布）
❌ 重复的、非时效性的行业常识
❌ 没有明确"最新"、"突发"、"发布"等时效性关键词的信息

## 必须包含的内容
✅ 新产品发布（发生在指定时间）
✅ 监管政策发布/更新（发生在指定时间）
✅ 原材料价格波动（发生在指定时间）
✅ 企业动态（并购、合作、人事变动等，发生在指定时间）
✅ 市场数据发布（最新的市场研究，发布时间在指定时间）
✅ 消费者趋势研究（最新发布，发布时间在指定时间）
✅ 渠道变化（新平台、新模式，发生在指定时间）

## 输出格式
如果找到符合条件的信息，返回：
【来源】标题 - 发生时间 | 原文链接（如果能找到）
摘要内容（50-100字，必须明确说明信息发生时间）

**要求**：
1. 如果是长篇报道，给出50-100字的核心摘要，不要全文
2. 必须包含明确的"事件发生时间"，而非"报道时间"
3. 如果能找到原文链接，必须提供（格式：https://...）
4. 每条信息控制在150字以内（含链接）

如果该时间段内没有符合条件的信息，只回复：无最新信息

最多返回2条。`
            },
            {
              role: 'user',
              content: `搜索关于"${query}"的最新市场信息。

**严格要求**：
1. 信息必须发生在 ${yesterdayDateStr} 08:00 到 ${todayDateStr} 08:00 之间（过去3天）
2. 不要包含几天前、几周前、几月前发生的事件
3. 如果不确定信息发生时间，不要包含
4. 每条信息控制在150字以内，长篇报道只给出50-100字摘要
5. 如果能找到原文链接，必须提供（格式：https://...）
6. 如果没有符合条件的信息，只回复"无最新信息"

请返回符合条件的市场信息，或回复"无最新信息"。`
            }
          ],
          temperature: 0.1,
          max_tokens: 350,
        },
        {
          headers: {
            'Authorization': `Bearer ${DOUBAO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;

        if (content && !content.includes('无最新信息') && !content.includes('无相关新闻') && content.trim().length > 10) {
          let lines = [];
          lines = content.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            allResults.push(`【${query}】${line.trim()}`);
          });

          if (lines.length > 0) {
            console.log(`  ✓ 找到 ${lines.length} 条`);
          } else {
            console.log(`  ⏭️  无最新信息`);
          }
        } else {
          console.log(`  ⏭️  无最新信息`);
        }
      } else {
        console.log(`  ✗ 无响应`);
      }
    } catch (error) {
      console.error(`  ✗ 搜索失败: ${query}`, error.message);
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          console.error(`  模型 ${DOUBAO_MODEL} 未找到或无访问权限`);
        } else if (status === 401) {
          console.error(`  API Key 无效或已过期`);
        }
        console.error('  响应:', JSON.stringify(error.response.data).substring(0, 300));
      }
    }
  }

  console.log(`\n✅ 搜索完成，共找到 ${allResults.length} 条最新市场信息\n`);
  return allResults;
}

// ========================================
// 核心功能：使用大模型分析市场信息
// ========================================

async function analyzeMarketTrends(newsResults) {
  console.log('🧠 分析市场趋势...\n');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 3);
  
  const yesterdayDateStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;
  const todayDateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  const systemPrompt = `你是一名资深的市场情报分析专家，专注于中国、东南亚和全球个人护理和化妆品行业。

你的目标受众是陶氏化学大中国区个人护理和化妆品事业部的市场经理，负责产品开发、定价和渠道策略。

## 关键要求：时效性 - 区分"信息发生时间"和"报道时间"

**重要**：你必须关注信息发生/发布的时间，而不是在本分析中的报道时间！

### 允许的信息（发生/发布时间在 ${yesterdayDateStr} 08:00 - ${todayDateStr} 08:00）：
✅ 新产品发布（发生在指定时间）
✅ 监管政策更新（在指定时间发布）
✅ 原材料价格波动（发生在指定时间）
✅ 企业公告（并购、合作、人事变动，发生在指定时间）
✅ 市场研究报告（在指定时间发布）
✅ 消费者趋势研究（在指定时间发布）
✅ 渠道创新（新平台、新模式，在指定时间启动）

### 排除的信息（发生/发布时间早于 ${yesterdayDateStr} 08:00）：
❌ 几周前的季度/年度财报数据（即使今天报道）
❌ 之前发布的政策（即使今天有新解读）
❌ 几周或几个月前的事件（即使今天有新进展）
❌ 回顾性报告（如"回顾上个季度"、"年度总结"）
❌ 历史市场数据（即使最近整理）

## 分析框架：

### 1. 市场维度分析

#### A. 中国市场（主要关注点）
- **监管**：NMPA（国家药监局）更新、成分限制、新注册要求
- **消费者**："成分党"趋势、纯净美妆、抗衰老、敏感肌
- **渠道**：直播（抖音/快手）、私域流量、小红书趋势、新零售
- **竞争对手**：欧莱雅、宝洁、联合利华、雅诗兰黛、资生堂以及国货品牌

#### B. 东南亚市场（增长机会）
- 市场规模和增长率
- 消费者偏好（如清真化妆品、美白、抗污染）
- 监管环境差异
- 渠道格局（社交电商主导）

#### C. 全球市场（参考）
- 美国/欧洲趋势洞察（纯净美妆、可持续性、个性化）
- 成分创新（新活性成分、递送系统）
- 包装和可持续性趋势

### 2. 对陶氏化学的战略相关性

#### A. 产品开发机会
- **硅油产品**：硅油使用趋势（轻盈、无油腻配方）
- **表面活性剂**：天然、温和、无硫酸盐趋势
- **聚合物**：成膜、质感提升、长效性能
- **活性成分递送**：包埋、缓释技术

#### B. 定价策略洞察
- **原材料成本**：影响配方成本的价格波动
- **竞争定位**：高端 vs. 大众市场趋势
- **价值主张**：消费者偏好中的性能与价格权衡

#### C. 渠道策略影响
- **电商主导**：在线销售的配方要求（稳定性、视觉吸引力）
- **直播**：快速演示、即时效果产品
- **专业渠道**：美容院/沙龙市场机会

### 3. 信息分类

**高影响（⭐⭐⭐⭐⭐）**：
- 影响陶氏关键成分的监管变化
- 使用陶氏类成分的主要竞争对手产品发布
- 原材料价格波动超过10%
- 具有大众市场潜力的新消费者趋势

**中等影响（⭐⭐⭐⭐）**：
- 次要竞争对手更新
- 逐步的消费者偏好转变
- 细分市场趋势
- 渠道演进

**低影响（⭐⭐⭐）**：
- 一般行业新闻
- 非竞争品牌更新
- 次要市场波动

### 4. 可执行建议

对于每个关键趋势，提供：
- **机会**：陶氏如何利用这一趋势
- **威胁**：对陶氏当前业务的潜在风险
- **下一步行动**：推荐行动（研究、合作、产品开发等）

## 输出格式（必须是纯JSON，不包含其他文本）：

{
  "analysisTime": "$CURRENT_TIME",
  "marketSummary": "2-3句话概括关键市场动向及其对陶氏化学个人护理和化妆品业务的影响",
  "marketTrends": [
    {
      "trend": "趋势名称",
      "category": "中国/东南亚/全球/监管/消费者/渠道/原材料",
      "impactLevel": 5,
      "description": "趋势简述（必须说明发生/发布时间）",
      "source": "信息来源（如：监管发布/企业公告/市场研究/行业新闻）",
      "relevanceToDow": "这对陶氏化学个人护理和化妆品业务为何重要",
      "opportunity": "商业机会（如：新产品开发、市场扩张）",
      "threat": "潜在风险（如：监管变化、竞争对手举措）",
      "nextSteps": [
        "推荐行动1",
        "推荐行动2"
      ]
    }
  ],
  "rawMaterialAlerts": [
    {
      "material": "原材料名称（如：硅油、表面活性剂）",
      "priceTrend": "Up/Down/Stable",
      "impact": "对配方成本的影响描述",
      "recommendation": "推荐行动（如：锁定库存、寻找替代品）"
    }
  ]
}

## 注意事项：
- impactLevel范围是1-5星（5=重大战略影响）
- 专注于对陶氏化学个人护理和化妆品业务的可执行洞察
- 优先考虑中国市场信息，然后是东南亚，最后是全球
- 如果没有符合条件的信息，返回空数组
- 必须返回纯JSON格式，不包含markdown代码块标记`;

  const userMessage = `以下是个人护理和化妆品行业（中国市场为主，兼顾东南亚和欧美市场）的最新市场信息：

${newsResults.join('\n\n')}

请分析这些最新市场信息，识别对陶氏化学个人护理和化妆品事业部具有重要战略意义的趋势、机会和威胁。

**严格要求**：
1. 只分析信息发生在 ${yesterdayDateStr} 08:00 到 ${todayDateStr} 08:00 之间的内容
2. 排除几天前、几周前、几月前发生的信息
3. 如果不确定信息发生时间，不要包含
4. 特别关注：
   - 监管政策变化（NMPA等）
   - 原材料价格波动
   - 竞争对手产品创新
   - 消费者趋势变化
   - 渠道创新
   - 东南亚市场机会
5. 为陶氏化学提供可执行的商业建议
6. 严格按照要求的JSON格式返回

注意：如果信息数量较少或没有重要趋势，请返回空数组。宁可保守，不要错误。`;

  try {
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        model: DOUBAO_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: 3500,
      },
      {
        headers: {
          'Authorization': `Bearer ${DOUBAO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 180000,
      }
    );

    console.log('✅ 市场趋势分析完成');

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : content;

    const result = JSON.parse(jsonText);
    result.analysisTime = getCurrentTime();
    result.dayOfWeek = getDayOfWeek();
    return result;
  } catch (error) {
    console.error('❌ 市场趋势分析失败:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response.data).substring(0, 500));
    }
    return {
      analysisTime: getCurrentTime(),
      dayOfWeek: getDayOfWeek(),
      marketTrends: [],
      rawMaterialAlerts: [],
    };
  }
}

// ========================================
// 飞书 API：获取访问令牌
// ========================================

async function getFeishuAccessToken() {
  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: FEISHU_CONFIG.APP_ID,
        app_secret: FEISHU_CONFIG.APP_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        timeout: 30000,
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`获取令牌失败: ${response.data.msg}`);
    }

    return response.data.tenant_access_token;
  } catch (error) {
    console.error('❌ 获取飞书令牌失败:', error.message);
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

// ========================================
// Email消息：格式化分析结果为HTML格式
// ========================================

function formatEmailMessage(data) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #ff6b35, #f7931e);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .info-box {
      background-color: #f9f9f9;
      border-left: 4px solid #ff6b35;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #333;
      border-bottom: 2px solid #ff6b35;
      padding-bottom: 10px;
      font-size: 20px;
    }
    .trend-item {
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .trend-title {
      color: #ff6b35;
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .impact-badge {
      display: inline-block;
      background-color: #ff6b35;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      margin: 5px 0;
    }
    .label {
      color: #666;
      font-weight: bold;
      font-size: 14px;
      margin-top: 10px;
    }
    .footer {
      background-color: #333;
      color: #999;
      padding: 20px;
      text-align: center;
      font-size: 12px;
    }
    .empty-message {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Elaine专属个人护理和化妆品市场情报</h1>
      <p>陶氏化学大中国区个人护理和化妆品事业部</p>
    </div>
    
    <div class="content">
      <div class="info-box">
        <strong>⏰ 更新时间：</strong>${data.analysisTime}（${data.dayOfWeek}）<br>
        <strong>📅 推送周期：</strong>每周二、周五早上8点<br>
        <strong>⚠️ 时效性：</strong>过去72小时（过去3天）内的市场信息
      </div>

      ${!data || (!data.marketTrends || data.marketTrends.length === 0) && (!data.rawMaterialAlerts || data.rawMaterialAlerts.length === 0) ? `
        <div class="empty-message">
          <p>暂无重要的市场动态或原材料价格波动，请稍后再试。</p>
        </div>
      ` : ''}

      ${data.marketSummary ? `
        <div class="section">
          <h2>📊 市场概要</h2>
          <p style="line-height: 1.6;">${data.marketSummary}</p>
        </div>
      ` : ''}

      ${data.marketTrends && data.marketTrends.length > 0 ? `
        <div class="section">
          <h2>🎯 市场趋势</h2>
          ${data.marketTrends.map((trend, index) => `
            <div class="trend-item">
              <div class="trend-title">${index + 1}. ${trend.trend}</div>
              <span class="impact-badge">影响级别: ${'⭐'.repeat(trend.impactLevel)} (${trend.impactLevel}/5)</span>
              
              <div class="label">📍 信息来源：</div>
              <p>${trend.source}</p>
              
              <div class="label">📝 趋势描述：</div>
              <p>${trend.description}</p>
              
              <div class="label">🎯 陶氏相关性：</div>
              <p>${trend.relevanceToDow}</p>
              
              ${trend.opportunity ? `
                <div class="label">💡 商业机会：</div>
                <p>${trend.opportunity}</p>
              ` : ''}
              
              ${trend.threat ? `
                <div class="label">⚠️ 潜在威胁：</div>
                <p>${trend.threat}</p>
              ` : ''}
              
              ${trend.nextSteps && trend.nextSteps.length > 0 ? `
                <div class="label">📋 建议行动：</div>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${trend.nextSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${data.rawMaterialAlerts && data.rawMaterialAlerts.length > 0 ? `
        <div class="section">
          <h2>💰 原材料价格预警</h2>
          ${data.rawMaterialAlerts.map(alert => `
            <div class="trend-item">
              <div class="trend-title">
                ${alert.priceTrend === 'Up' ? '📈' : (alert.priceTrend === 'Down' ? '📉' : '➡️')} ${alert.material}
              </div>
              <span class="impact-badge" style="background-color: ${alert.priceTrend === 'Up' ? '#ff4444' : (alert.priceTrend === 'Down' ? '#44cc44' : '#999')}">
                价格趋势：${alert.priceTrend}
              </span>
              
              <div class="label">影响：</div>
              <p>${alert.impact}</p>
              
              <div class="label">建议：</div>
              <p>${alert.recommendation}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>本邮件由 Elaine专属个人护理和化妆品市场情报系统自动发送</p>
      <p>如有疑问，请联系系统管理员</p>
    </div>
  </div>
</body>
</html>
  `;

  return {
    subject: `🧪 Elaine专属市场情报 - ${data.analysisTime}`,
    html: htmlContent,
    text: `Elaine专属个人护理和化妆品市场情报系统

更新时间：${data.analysisTime}（${data.dayOfWeek}）
推送周期：每周二、周五早上8点
时效性：过去72小时内的市场信息

${data.marketSummary || ''}

市场趋势：${data.marketTrends ? data.marketTrends.length : 0}条
原材料预警：${data.rawMaterialAlerts ? data.rawMaterialAlerts.length : 0}条

本邮件由 Elaine专属个人护理和化妆品市场情报系统自动发送`
  };
}

// ========================================
// Email API：发送邮件
// ========================================

async function sendEmail(message) {
  try {
    console.log('📧 准备发送邮件...');

    // 检查Email配置
    if (!EMAIL_CONFIG.SMTP_USER || !EMAIL_CONFIG.SMTP_PASS) {
      console.warn('⚠️ Email配置不完整，跳过邮件发送');
      return false;
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.SMTP_HOST,
      port: EMAIL_CONFIG.SMTP_PORT,
      secure: EMAIL_CONFIG.SMTP_PORT === 465, // 465端口使用SSL，587使用STARTTLS
      auth: {
        user: EMAIL_CONFIG.SMTP_USER,
        pass: EMAIL_CONFIG.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // 企业证书可能需要此选项
      },
    });

    // 邮件内容
    const mailOptions = {
      from: EMAIL_CONFIG.EMAIL_FROM,
      to: EMAIL_CONFIG.EMAIL_TO,
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功！');
    console.log('📝 邮件ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ 发送邮件失败:', error.message);
    if (error.response) {
      console.error('SMTP响应:', error.response);
    }
    return false;
  }
}

// ========================================
// 飞书消息：格式化分析结果
// ========================================

function formatFeishuMessage(data) {
  if (!data || (!data.marketTrends || data.marketTrends.length === 0) && (!data.rawMaterialAlerts || data.rawMaterialAlerts.length === 0)) {
    return {
      msg_type: 'text',
      content: JSON.stringify({
        text: `🧪 Elaine专属个人护理和化妆品市场情报
        
⏰ 更新时间：${data.analysisTime}（${data.dayOfWeek}）
📅 推送周期：每周二、周五早上8点

📋 说明：本系统推送最近72小时（过去3天）内的个人护理和化妆品市场动态，特别关注中国市场，兼顾东南亚和欧美市场信息。

暂无重要的市场动态或原材料价格波动，请稍后再试。`
      }),
    };
  }

  let cardContent = {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: 'plain_text',
        content: '🧪 Elaine专属个人护理和化妆品市场情报',
      },
      template: 'orange',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**⏰ 更新时间**：${data.analysisTime}（${data.dayOfWeek}）\n**📅 推送周期**：每周二、周五早上8点\n**⚠️ 时效性说明**：以下信息均发生在最近72小时（过去3天）内\n`,
        },
      },
      {
        tag: 'hr',
      },
    ],
  };

  // 添加市场摘要
  if (data.marketSummary) {
    cardContent.elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `### 📊 市场概要\n${data.marketSummary}`,
      },
    });
    cardContent.elements.push({
      tag: 'hr',
    });
  }

  // 添加市场趋势
  if (data.marketTrends && data.marketTrends.length > 0) {
    cardContent.elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `### 🎯 市场趋势`,
      },
    });

    data.marketTrends.forEach((trend, index) => {
      const stars = '⭐'.repeat(trend.impactLevel);
      const impactColor = trend.impactLevel >= 5 ? 'red' : (trend.impactLevel >= 4 ? 'orange' : 'gray');

      cardContent.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `#### ${index + 1}. ${trend.trend}`,
        },
      });

      cardContent.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**📍 信息来源**：${trend.source}`,
        },
      });

      cardContent.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**📊 影响级别**：<font color="${impactColor}">${stars} (${trend.impactLevel}/5)</font>`,
        },
      });

      cardContent.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**📝 趋势描述**：${trend.description}`,
        },
      });

      cardContent.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**🎯 陶氏相关性**：${trend.relevanceToDow}`,
        },
      });

      if (trend.opportunity) {
        cardContent.elements.push({
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**💡 商业机会**：${trend.opportunity}`,
          },
        });
      }

      if (trend.threat) {
        cardContent.elements.push({
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**⚠️ 潜在威胁**：${trend.threat}`,
          },
        });
      }

      if (trend.nextSteps && trend.nextSteps.length > 0) {
        const stepsList = trend.nextSteps.map(step => `• ${step}`).join('\n');
        cardContent.elements.push({
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**📋 建议行动**：\n${stepsList}`,
          },
        });
      }

      if (index < data.marketTrends.length - 1) {
        cardContent.elements.push({
          tag: 'hr',
        });
      }
    });

    if (data.rawMaterialAlerts && data.rawMaterialAlerts.length > 0) {
      cardContent.elements.push({
        tag: 'hr',
      });
    }
  }

  // 添加原材料价格预警
  if (data.rawMaterialAlerts && data.rawMaterialAlerts.length > 0) {
    cardContent.elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `### 💰 原材料价格预警`,
      },
    });

    data.rawMaterialAlerts.forEach((alert, index) => {
      const trendIcon = alert.priceTrend === 'Up' ? '📈' : (alert.priceTrend === 'Down' ? '📉' : '➡️');
      const trendColor = alert.priceTrend === 'Up' ? 'red' : (alert.priceTrend === 'Down' ? 'green' : 'gray');
      
      cardContent.elements.push({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${trendIcon} ${alert.material}**\n<font color="${trendColor}">价格趋势：${alert.priceTrend}</font>\n**影响**：${alert.impact}\n**建议**：${alert.recommendation}`,
        },
      });

      if (index < data.rawMaterialAlerts.length - 1) {
        cardContent.elements.push({
          tag: 'hr',
        });
      }
    });
  }

  return {
    msg_type: 'interactive',
    content: JSON.stringify(cardContent),
  };
}

// ========================================
// 飞书 API：发送消息到群聊
// ========================================

async function sendToFeishu(message) {
  try {
    const accessToken = await getFeishuAccessToken();

    console.log('📤 发送消息到飞书群...');

    const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id`;
    
    const response = await axios.post(
      url,
      {
        receive_id: FEISHU_CONFIG.GROUP_CHAT_ID,
        msg_type: message.msg_type,
        content: message.content,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        timeout: 30000,
      }
    );

    if (response.data.code !== 0) {
      console.error('❌ 飞书API错误:', response.data);
      throw new Error(`发送失败: ${response.data.msg}`);
    }

    console.log('✅ 消息发送成功！');
    console.log('📝 消息ID:', response.data.data.msg_id);
  } catch (error) {
    console.error('❌ 发送消息失败:', error.message);
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

// ========================================
// 主程序
// ========================================

async function main() {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 3);
    
    const yesterdayDateStr = `${yesterday.getFullYear()}/${String(yesterday.getMonth() + 1).padStart(2, '0')}/${String(yesterday.getDate()).padStart(2, '0')}`;
    const todayDateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    console.log('========================================');
    console.log('🧪 Elaine专属个人护理和化妆品市场情报系统');
    console.log('========================================');
    console.log('📅 推送周期：每周二、周五早上8点');
    console.log(`⏰ 信息时间范围：${yesterdayDateStr} 08:00 - ${todayDateStr} 08:00`);
    console.log('');
    console.log('🎯 目标用户：陶氏化学大中国区个人护理和化妆品事业部市场经理');
    console.log('🌍 信息范围：');
    console.log('  • 中国市场（主市场）');
    console.log('  • 东南亚市场（增长机会）');
    console.log('  • 欧美市场（趋势参考）');
    console.log('');
    console.log('📋 监控维度：');
    console.log('  • 行业动态和监管政策');
    console.log('  • 竞争对手动态（欧莱雅、宝洁、联合利华等）');
    console.log('  • 新产品发布和技术创新');
    console.log('  • 原材料价格变化（硅油、表面活性剂等）');
    console.log('  • 消费者趋势（成分党、纯净美妆等）');
    console.log('  • 渠道变化（直播、私域、小红书等）');
    console.log('');
    console.log('📊 分析重点：');
    console.log('  • 产品开发机会');
    console.log('  • 定价策略洞察');
    console.log('  • 渠道策略建议');
    console.log('  • 可执行的商业建议');
    console.log('========================================\n');

    console.log(`🤖 使用模型: ${DOUBAO_MODEL}\n`);

    // 步骤1：搜索市场信息
    const newsResults = await searchMarketNews();
    console.log('');

    // 步骤2：分析市场趋势
    const analysisData = await analyzeMarketTrends(newsResults);
    console.log('');

    // 步骤3：格式化飞书消息
    const message = formatFeishuMessage(analysisData);
    console.log('✅ 消息格式化成功\n');

    // 步骤4：发送到飞书群
    await sendToFeishu(message);

    // 步骤5：发送Email
    const emailMessage = formatEmailMessage(analysisData);
    const emailSent = await sendEmail(emailMessage);
    if (emailSent) {
      console.log('✅ Email发送成功\n');
    } else {
      console.log('⚠️ Email发送失败或跳过\n');
    }

    console.log('\n========================================');
    console.log('✅ 推送完成！');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ 推送失败:', error.message);

    // 发送飞书错误通知
    try {
      const errorMessage = {
        msg_type: 'text',
        content: JSON.stringify({
          text: `❌ Elaine专属市场情报推送失败\n\n🔍 错误信息：${error.message}\n⏰ 时间：${getCurrentTime()}`
        }),
      };
      await sendToFeishu(errorMessage);
    } catch (sendError) {
      console.error('❌ 发送飞书错误通知失败:', sendError.message);
    }

    // 发送Email错误通知
    try {
      if (EMAIL_CONFIG.SMTP_USER && EMAIL_CONFIG.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: EMAIL_CONFIG.SMTP_HOST,
          port: EMAIL_CONFIG.SMTP_PORT,
          secure: EMAIL_CONFIG.SMTP_PORT === 465,
          auth: {
            user: EMAIL_CONFIG.SMTP_USER,
            pass: EMAIL_CONFIG.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.sendMail({
          from: EMAIL_CONFIG.EMAIL_FROM,
          to: EMAIL_CONFIG.EMAIL_TO,
          subject: `❌ 市场情报系统推送失败 - ${getCurrentTime()}`,
          html: `
            <h2>❌ 系统推送失败</h2>
            <p><strong>错误信息：</strong>${error.message}</p>
            <p><strong>错误时间：</strong>${getCurrentTime()}</p>
            <p>请检查系统配置或联系管理员。</p>
          `,
          text: `Elaine专属市场情报系统推送失败\n\n错误信息：${error.message}\n错误时间：${getCurrentTime()}\n\n请检查系统配置或联系管理员。`
        });
        console.log('✅ Email错误通知发送成功');
      }
    } catch (emailError) {
      console.error('❌ 发送Email错误通知失败:', emailError.message);
    }

    process.exit(1);
  }
}

// 运行主程序
main();
