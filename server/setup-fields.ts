// 为新多维表格创建匹配的字段结构
import 'dotenv/config'
import { feishuRequest } from './feishu'

const STUDENT_APP = 'TptHbMbDmaDvqzs4LTncgwOPnGe'
const STUDENT_TABLE = 'tblndPKQSY12rXPT'   // 学生档案（默认表）
const LESSON_TABLE = 'tblRjp2ZcVdaaLM7'    // 上课日历

const MATERIAL_APP = 'JjFPbxBVzahCIbsXIltcJyOYnce'
const MATERIAL_TABLE = 'tblGWnXp8LU9qSeQ'  // 课件（默认表）

async function addField(appToken: string, tableId: string, field: any) {
  try {
    await feishuRequest('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, field)
    console.log(`  ✅ ${field.field_name}`)
  } catch (err: any) {
    if (err.message.includes('already')) {
      console.log(`  ⏭️  ${field.field_name} (已存在)`)
    } else {
      console.log(`  ⚠️  ${field.field_name}: ${err.message}`)
    }
  }
}

async function main() {
  // ── 学生档案字段 ──
  console.log('📋 设置「学生档案」字段…')
  const studentFields = [
    { field_name: '微信昵称', type: 1 },
    { field_name: '微信ID', type: 1 },
    { field_name: '学生名称', type: 1 },
    { field_name: '非本人上课', type: 3, property: { options: [{ name: '是', color: 1 }, { name: '否', color: 0 }] } },
    { field_name: '目前状态', type: 3, property: { options: [
      { name: '正式课多节一付', color: 1 },
      { name: '正式课单节一付', color: 2 },
      { name: '仅上试听课', color: 0 },
      { name: '未上课', color: 3 },
      { name: '0号学生', color: 4 },
    ]}},
    { field_name: '进度', type: 1 },
    { field_name: '文档链接', type: 1 },
    { field_name: '上课地点', type: 1 },
    { field_name: '试听课价格', type: 2 },
    { field_name: '单次价格', type: 2 },
    { field_name: '10次价格', type: 2 },
    { field_name: '20次价格', type: 2 },
    { field_name: '备注', type: 1 },
    { field_name: '首节试听课日期', type: 5 },
    { field_name: '器乐基础', type: 1 },
    { field_name: '音乐偏好', type: 1 },
  ]
  for (const f of studentFields) {
    await addField(STUDENT_APP, STUDENT_TABLE, f)
  }

  // ── 上课日历字段 ──
  console.log('\n📋 设置「上课日历」字段…')
  const lessonFields = [
    { field_name: '学生名称', type: 1 },
    { field_name: '开始时间', type: 5, property: { date_formatter: 'yyyy/MM/dd HH:mm' } },
    { field_name: '结束时间', type: 5, property: { date_formatter: 'yyyy/MM/dd HH:mm' } },
    { field_name: '时长', type: 2 },
    { field_name: '当前状态', type: 3, property: { options: [
      { name: '未上课', color: 0 },
      { name: '已上课', color: 1 },
      { name: '放鸽子', color: 2 },
    ]}},
    { field_name: '月份', type: 1 },
    { field_name: '周', type: 1 },
  ]
  for (const f of lessonFields) {
    await addField(STUDENT_APP, LESSON_TABLE, f)
  }

  // ── 课件字段 ──
  console.log('\n📋 设置「课件」字段…')
  const materialFields = [
    { field_name: '教学内容', type: 1 },
    { field_name: '一级分类', type: 3, property: { options: [
      { name: '演奏技法', color: 1 },
      { name: '乐理', color: 2 },
      { name: '曲目与乐段', color: 3 },
      { name: '机能与节奏感', color: 4 },
      { name: '设备知识', color: 5 },
      { name: '软件使用', color: 6 },
    ]}},
    { field_name: '二级分类', type: 1 },
    { field_name: '难度', type: 2 },
    { field_name: '课件链接', type: 1 },
    { field_name: '目标速度', type: 1 },
    { field_name: '备注', type: 1 },
  ]
  for (const f of materialFields) {
    await addField(MATERIAL_APP, MATERIAL_TABLE, f)
  }

  console.log('\n✅ 字段设置完成！')
  console.log(`\n📋 配置信息已就绪：
  BITABLE_STUDENT=${STUDENT_APP}
  BITABLE_MATERIAL=${MATERIAL_APP}
  STUDENT_TABLE=${STUDENT_TABLE}
  LESSON_TABLE=${LESSON_TABLE}
  MATERIAL_TABLE=${MATERIAL_TABLE}`)
}

main().catch((err) => console.error('❌', err.message))
