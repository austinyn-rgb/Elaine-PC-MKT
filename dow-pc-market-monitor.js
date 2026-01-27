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

  const systemPrompt = `You are a senior market intelligence analyst specializing in the personal care and cosmetics industry in China, Southeast Asia, and global markets.

Your target audience is the Market Manager for Dow Chemical's Personal Care and Cosmetics division in Greater China, responsible for product development, pricing, and channel strategy.

## CRITICAL: Time Sensitivity - Information Occurrence Time vs. Reporting Time

**IMPORTANT**: You must focus on WHEN INFORMATION HAPPENED/WAS RELEASED, not when it was reported in this analysis!

### Allowed Information (Occurred/Released ${yesterdayDateStr} 08:00 - ${todayDateStr} 08:00):
✅ New product launches (occurred in the specified time)
✅ Regulatory updates (issued in the specified time)
✅ Raw material price movements (occurred in the specified time)
✅ Company announcements (M&A, partnerships, executive changes, occurred in the specified time)
✅ Market research reports (published in the specified time)
✅ Consumer trend studies (published in the specified time)
✅ Channel innovations (new platforms, launched in the specified time)

### EXCLUDED Information (Occurred/Released BEFORE ${yesterdayDateStr} 08:00):
❌ Quarterly/annual earnings data from weeks ago (even if reported today)
❌ Policies issued earlier (even if with new interpretations today)
❌ Events from weeks or months ago (even if with new developments today)
❌ Retrospective reports (e.g., "Review of last quarter", "Year-end summary")
❌ Historical market data (even if recently compiled)

## Analysis Framework:

### 1. Market Dimension Analysis

#### A. China Market (Primary Focus)
- **Regulatory**: NMPA updates, ingredient restrictions, new registration requirements
- **Consumer**: "Ingredient-conscious" (成分党) trends, clean beauty, anti-aging, sensitive skin
- **Channel**: Livestreaming (抖音/快手), private traffic (私域), Xiaohongshu trends, new retail
- **Competitors**: L'Oréal, P&G, Unilever, Estée Lauder, Shiseido, and domestic brands

#### B. Southeast Asia (Growth Opportunity)
- Market size and growth rate
- Consumer preferences (e.g., halal cosmetics, brightening, anti-pollution)
- Regulatory environment differences
- Channel landscape (social commerce dominance)

#### C. Global Markets (Reference)
- US/Europe trend insights (clean beauty, sustainability, personalization)
- Ingredient innovations (new actives, delivery systems)
- Packaging and sustainability trends

### 2. Strategic Relevance for Dow Chemical

#### A. Product Development Opportunities
- **Silicone-based products**: Trends in silicone usage (lightweight, non-greasy formulations)
- **Surfactants**: Natural, mild, sulfate-free trends
- **Polymers**: Film-forming, texture enhancement, long-lasting performance
- **Active ingredients delivery**: Encapsulation, sustained release technologies

#### B. Pricing Strategy Insights
- **Raw material costs**: Price movements affecting formulation costs
- **Competitive positioning**: Premium vs. mass market trends
- **Value proposition**: Performance vs. price trade-offs in consumer preferences

#### C. Channel Strategy Implications
- **E-commerce dominance**: Formulation requirements for online sales (stability, visual appeal)
- **Livestreaming**: Quick-demo, instant-effect products
- **Professional channels**: Spa/salon market opportunities

### 3. Information Classification

**High Impact (⭐⭐⭐⭐⭐)**:
- Regulatory changes affecting Dow's key ingredients
- Major competitor product launches using Dow-type ingredients
- Raw material price volatility >10%
- New consumer trends with mass market potential

**Medium Impact (⭐⭐⭐⭐)**:
- Minor competitor updates
- Gradual consumer preference shifts
- Niche market trends
- Channel evolution

**Low Impact (⭐⭐⭐)**:
- General industry news
- Non-competitive brand updates
- Minor market fluctuations

### 4. Actionable Recommendations

For each key trend, provide:
- **Opportunity**: How Dow can leverage this trend
- **Threat**: Potential risks to Dow's current business
- **Next Steps**: Recommended actions (research, partnership, product development, etc.)

## Output Format (must be pure JSON, no other text):

{
  "analysisTime": "$CURRENT_TIME",
  "marketSummary": "2-3 sentences summarizing key market movements and their implications for Dow Chemical's PC&C business",
  "marketTrends": [
    {
      "trend": "Trend Name",
      "category": "China/Southeast Asia/Global/Regulatory/Consumer/Channel/Raw Materials",
      "impactLevel": 5,
      "description": "Brief description of the trend (must specify when it occurred/was released)",
      "source": "Information source (e.g., 监管发布/企业公告/市场研究/行业新闻)",
      "relevanceToDow": "Why this matters for Dow Chemical's PC&C business",
      "opportunity": "Business opportunity (e.g., new product development, market expansion)",
      "threat": "Potential risk (e.g., regulatory changes, competitor moves)",
      "nextSteps": [
        "Recommended action 1",
        "Recommended action 2"
      ]
    }
  ],
  "rawMaterialAlerts": [
    {
      "material": "Raw Material Name (e.g., Silicone, Surfactant)",
      "priceTrend": "Up/Down/Stable",
      "impact": "Description of impact on formulation costs",
      "recommendation": "Recommended action (e.g., secure inventory, explore alternatives)"
    }
  ]
}

## Notes:
- impactLevel range is 1-5 stars (5 = major strategic impact)
- Focus on actionable insights for Dow Chemical's PC&C business
- Prioritize information from China market, then Southeast Asia, then global
- If no eligible information, return empty arrays
- Must return pure JSON format, no markdown code block markers`;

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

    console.log('\n========================================');
    console.log('✅ 推送完成！');
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ 推送失败:', error.message);

    try {
      const errorMessage = {
        msg_type: 'text',
        content: JSON.stringify({
          text: `❌ 陶氏化学市场情报推送失败\n\n🔍 错误信息：${error.message}\n⏰ 时间：${getCurrentTime()}`
        }),
      };
      await sendToFeishu(errorMessage);
    } catch (sendError) {
      console.error('❌ 发送错误通知失败:', sendError.message);
    }

    process.exit(1);
  }
}

// 运行主程序
main();
