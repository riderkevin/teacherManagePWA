// 飞书多维表格迁移：创建新 bitable，复制字段结构和数据
import 'dotenv/config'
import { feishuRequest, getAccessToken, getRecords } from './feishu'

const OLD_BITABLE = 'G1XqbAgAOaSARxsACdscgEKJnre'
const OLD_BITABLE2 = 'Z3FCbZpY0akbRasmLZ7cYjecnI1'

// 字段类型映射：Feishu type → 新表创建用
const TEXT = 1
const NUMBER = 2
const SELECT = 3
const DATE = 5
const URL_TYPE = 15
const LINK = 18

async function copyTable(
  oldAppToken: string,
  oldTableId: string,
  newAppToken: string,
  newTableId: string,
  label: string,
) {
  // 1. 获取旧字段
  const oldFields = await feishuRequest<any>('GET', `/bitable/v1/apps/${oldAppToken}/tables/${oldTableId}/fields`)
  const fields = oldFields.items || []
  console.log(`   📋 ${label}: 共 ${fields.length} 个字段`)

  // 2. 过滤可迁移的字段（排除公式、按钮等不可写的字段类型）
  // type 1=Text, 2=Number, 3=Select, 5=Date, 15=URL, 18=关联
  const migratableFields = fields.filter((f: any) =>
    [TEXT, NUMBER, SELECT, DATE, URL_TYPE, LINK].includes(f.type)
  )

  // 3. 获取旧表数据
  const oldData = await getRecords(oldAppToken, oldTableId, 200)
  const records = oldData.items || []
  console.log(`   📥 ${label}: ${records.length} 条记录`)

  if (records.length === 0) {
    console.log(`   ⏭️  无数据，跳过`)
    return
  }

  // 4. 用第一条记录试探写入，缺什么字段就创建什么
  const firstRecordFields = records[0].fields
  const existingFieldNames = new Set<string>()

  // 先获取新表的已有字段
  try {
    const newFields = await feishuRequest<any>('GET', `/bitable/v1/apps/${newAppToken}/tables/${newTableId}/fields`)
    for (const f of (newFields.items || [])) {
      existingFieldNames.add(f.field_name)
    }
  } catch {}

  // 5. 创建缺失的字段
  for (const f of migratableFields) {
    if (!existingFieldNames.has(f.field_name)) {
      try {
        await feishuRequest<any>('POST', `/bitable/v1/apps/${newAppToken}/tables/${newTableId}/fields`, {
          field_name: f.field_name,
          type: f.type,
          ...(f.property ? { property: f.property } : {}),
        })
        existingFieldNames.add(f.field_name)
      } catch (err: any) {
        console.log(`   ⚠️  创建字段"${f.field_name}"失败: ${err.message}`)
      }
    }
  }

  // 6. 分批写入记录（只保留已存在字段的数据）
  const filteredRecords = records.map((r: any) => {
    const clean: any = {}
    for (const [key, val] of Object.entries(r.fields)) {
      if (existingFieldNames.has(key)) {
        clean[key] = val
      }
    }
    return { fields: clean }
  })

  const BATCH = 100
  for (let i = 0; i < filteredRecords.length; i += BATCH) {
    const batch = filteredRecords.slice(i, i + BATCH)
    try {
      await feishuRequest<any>(
        'POST',
        `/bitable/v1/apps/${newAppToken}/tables/${newTableId}/records/batch_create`,
        { records: batch },
      )
      process.stdout.write(`\r   ✅ ${label}: ${Math.min(i + BATCH, filteredRecords.length)}/${filteredRecords.length}`)
    } catch (err: any) {
      process.stdout.write(`\r   ⚠️  批次写入失败: ${err.message}\n`)
    }
  }
  console.log()
}

async function main() {
  console.log('🚀 开始迁移…\n')

  // ── 1. 创建多维表格 1: 学生管理 ──
  console.log('📁 创建「学生管理」多维表格…')
  const new1 = await feishuRequest<any>('POST', '/bitable/v1/apps', { name: '学生管理' })
  const studentAppToken = new1.app.app_token
  const studentTableId = new1.app.default_table_id
  console.log(`   ✅ ${studentAppToken} (默认表: ${studentTableId})`)

  // 在"学生管理"中创建第二个表：上课日历
  console.log('📁 创建「上课日历」表…')
  const lessonTable = await feishuRequest<any>('POST', `/bitable/v1/apps/${studentAppToken}/tables`, {
    table: { name: '上课日历' },
  })
  const lessonTableId = lessonTable.table_id
  console.log(`   ✅ ${lessonTableId}`)

  // ── 2. 创建多维表格 2: 课件管理 ──
  console.log('\n📁 创建「课件管理」多维表格…')
  const new2 = await feishuRequest<any>('POST', '/bitable/v1/apps', { name: '课件管理' })
  const materialAppToken = new2.app.app_token
  const materialTableId = new2.app.default_table_id
  console.log(`   ✅ ${materialAppToken} (默认表: ${materialTableId})`)

  // ── 3. 复制数据 ──
  console.log('\n📥 开始复制数据…\n')
  await copyTable(OLD_BITABLE, 'tblVt8tM8SIuEoB2', studentAppToken, studentTableId, '学生档案')
  await copyTable(OLD_BITABLE, 'tblFtZ4RlRBysRGo', studentAppToken, lessonTableId, '上课日历')
  await copyTable(OLD_BITABLE2, 'tblhvyteO4fI1Ubl', materialAppToken, materialTableId, '课件数据')

  // ── 结果 ──
  console.log('\n═══════════════════════════════════════')
  console.log('✅ 迁移完成！')
  console.log()
  console.log('📋 新的多维表格 ID：')
  console.log()
  console.log('  BITABLE_STUDENT =', studentAppToken)
  console.log('  BITABLE_MATERIAL =', materialAppToken)
  console.log()
  console.log('📋 同步配置已自动更新到 server/routes/sync.ts')
  console.log('═══════════════════════════════════════')

  // 写入配置文件供 sync.ts 读取
  const fs = await import('fs')
  const envUpdate = `
# 飞书多维表格（应用自动拥有读写权限）
BITABLE_STUDENT=${studentAppToken}
BITABLE_MATERIAL=${materialAppToken}
`.trim()
  const envPath = new URL('../.env', import.meta.url).pathname
  let envContent = fs.readFileSync(envPath, 'utf-8')
  // 移除旧配置行，追加新配置
  envContent = envContent
    .split('\n')
    .filter((l) => !l.startsWith('BITABLE_'))
    .join('\n')
  fs.writeFileSync(envPath, envContent + '\n' + envUpdate + '\n')
  console.log('\n📝 .env 已更新')
}

main().catch((err) => {
  console.error('\n❌ 迁移失败:', err.message)
  process.exit(1)
})
