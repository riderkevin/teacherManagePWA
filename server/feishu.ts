import axios from 'axios'

// ── Token 管理 ──
let cachedToken: string | null = null
let tokenExpiresAt: number = 0

/** 获取 tenant_access_token */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error('缺少 FEISHU_APP_ID 或 FEISHU_APP_SECRET 环境变量')
  }

  const { data } = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    { app_id: appId, app_secret: appSecret },
    { headers: { 'Content-Type': 'application/json' } },
  )

  if (data.code !== 0) {
    throw new Error(`飞书认证失败: ${data.msg}`)
  }

  cachedToken = data.tenant_access_token
  tokenExpiresAt = Date.now() + data.expire * 1000
  return cachedToken!
}

// ── 通用请求封装 ──
export async function feishuRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any,
  query?: Record<string, string>,
): Promise<T> {
  const token = await getAccessToken()
  const url = `https://open.feishu.cn/open-apis${path}`

  const { data } = await axios({
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    params: query,
    data: body,
  })

  if (data.code !== 0) {
    throw new Error(`飞书 API 错误 [${data.code}]: ${data.msg}`)
  }

  return data.data as T
}

// ── Bitable 相关 ──

/** 列出多维表格下的所有数据表 */
export async function listTables(appToken: string) {
  const data = await feishuRequest<any>('GET', `/bitable/v1/apps/${appToken}/tables`)
  return data.items || []
}

/** 获取数据表的字段元数据 */
export async function listFields(appToken: string, tableId: string) {
  const data = await feishuRequest<any>('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`)
  return data.items || []
}

/** 获取数据表记录 */
export async function getRecords(appToken: string, tableId: string, pageSize: number = 100, pageToken?: string) {
  const query: Record<string, string> = { page_size: String(pageSize) }
  if (pageToken) query.page_token = pageToken
  const data = await feishuRequest<any>('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/records`, undefined, query)
  return data
}

/** 新增记录 */
export async function addRecords(appToken: string, tableId: string, records: any[]) {
  return feishuRequest<any>('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, { records })
}

/** 更新记录 */
export async function updateRecords(appToken: string, tableId: string, records: any[]) {
  return feishuRequest<any>('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_update`, { records })
}

/** 删除记录 */
export async function deleteRecords(appToken: string, tableId: string, recordIds: string[]) {
  return feishuRequest<any>('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_delete`, { records: recordIds })
}

// ── 日历相关 ──

/** 创建日历事件 */
export async function createCalendarEvent(calendarId: string, event: any) {
  return feishuRequest<any>('POST', `/calendar/v4/calendars/${calendarId}/events`, event)
}

/** 获取日历事件列表 */
export async function getCalendarEvents(calendarId: string, startTime?: string, endTime?: string) {
  const query: Record<string, string> = {}
  if (startTime) query.start_time = startTime
  if (endTime) query.end_time = endTime
  return feishuRequest<any>('GET', `/calendar/v4/calendars/${calendarId}/events`, undefined, query)
}

/** 获取用户主日历ID */
export async function getPrimaryCalendar() {
  const data = await feishuRequest<any>('GET', '/calendar/v4/calendars/primary')
  return data
}

// ── 文档相关 ──

/** 获取文档内容 */
export async function getDocumentContent(docToken: string) {
  return feishuRequest<any>('GET', `/docx/v1/documents/${docToken}/raw_content`)
}

/** 获取文档块内容 */
export async function getDocumentBlocks(docToken: string, pageSize: number = 100) {
  const data = await feishuRequest<any>('GET', `/docx/v1/documents/${docToken}/blocks`, undefined, { page_size: String(pageSize) })
  return data
}
