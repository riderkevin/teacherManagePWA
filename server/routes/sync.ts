import { Router } from 'express'
import { getRecords, addRecords } from '../feishu'

// 你的多维表格配置（新表，应用自动拥有读写权限）
const BITABLE_STUDENT = 'TptHbMbDmaDvqzs4LTncgwOPnGe'
const STUDENT_TABLE = 'tblndPKQSY12rXPT'
const LESSON_TABLE = 'tblRjp2ZcVdaaLM7'

const BITABLE_MATERIAL = 'JjFPbxBVzahCIbsXIltcJyOYnce'
const MATERIAL_TABLE = 'tblGWnXp8LU9qSeQ'

// ── 字段映射 ──
function localStudentToFeishu(s: any) {
  return {
    fields: {
      '微信昵称': s.wechatNickname || '',
      '微信ID': s.wechatId || '',
      '学生名称': s.wechatNickname || '',
      '非本人上课': s.isNotSelf ? '是' : '否',
      '目前状态': s.status || '未上课',
      '进度': s.progress || '',
      '文档链接': s.docLink || '',
      '上课地点': s.location || '',
      '试听课价格': Number(s.trialPrice) || 0,
      '单次价格': Number(s.singlePrice) || 0,
      '10次价格': Number(s.tenPackPrice) || 0,
      '20次价格': Number(s.twentyPackPrice) || 0,
      '备注': s.notes || '',
      '首节试听课日期': s.firstTrialDate ? Date.parse(s.firstTrialDate.replace(/\//g, '-')) : null,
      '器乐基础': s.instrumentBackground || '',
      '音乐偏好': s.musicPreference || '',
    },
  }
}

function localLessonToFeishu(l: any) {
  return {
    fields: {
      '学生名称': l.studentName || '',
      '开始时间': l.startTime ? Date.parse(l.startTime.replace(/\//g, '-')) : null,
      '结束时间': l.endTime ? Date.parse(l.endTime.replace(/\//g, '-')) : null,
      '时长': Number(l.duration) || 1,
      '当前状态': l.status || '未上课',
      '月份': l.month || '',
      '周': l.week || '',
    },
  }
}

function localMaterialToFeishu(m: any) {
  return {
    fields: {
      '教学内容': m.content || '',
      '一级分类': m.category || '演奏技法',
      '二级分类': m.subcategory || '',
      '难度': Number(m.difficulty) || 1,
      '课件链接': m.fileLink || '',
      '目标速度': m.targetSpeed || '',
      '备注': m.notes || '',
    },
  }
}

export function setupSyncRoutes(app: Router) {
  // ── 学生同步 ──
  app.post('/api/sync/students/push', async (req, res) => {
    try {
      const { students } = req.body
      const records = students.map(localStudentToFeishu)
      const result = await addRecords(BITABLE_STUDENT, STUDENT_TABLE, records)
      res.json({ success: true, count: result?.records?.length || 0 })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.get('/api/sync/students/pull', async (req, res) => {
    try {
      const data = await getRecords(BITABLE_STUDENT, STUDENT_TABLE, 200)
      const students = (data?.items || []).map((r: any) => {
        const f = r.fields
        return {
          wechatNickname: f['微信昵称'] || '',
          wechatId: f['微信ID'] || '',
          isNotSelf: f['非本人上课'] === '是',
          actualStudentName: f['非本人上课'] === '是' ? (f['学生名称'] || '') : '',
          progress: f['进度'] || '',
          docLink: f['文档链接'] || '',
          location: f['上课地点'] || '',
          trialPrice: Number(f['试听课价格']) || 0,
          singlePrice: Number(f['单次价格']) || 0,
          tenPackPrice: Number(f['10次价格']) || 0,
          twentyPackPrice: Number(f['20次价格']) || 0,
          notes: f['备注'] || '',
          firstTrialDate: f['首节试听课日期']
            ? new Date(f['首节试听课日期']).toISOString().slice(0, 10).replace(/-/g, '/')
            : '',
          status: f['目前状态'] || '未上课',
          instrumentBackground: f['器乐基础'] || '',
          musicPreference: f['音乐偏好'] || '',
          _feishuId: r.record_id,
        }
      })
      res.json({ success: true, data: students })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // ── 课程同步 ──
  app.post('/api/sync/lessons/push', async (req, res) => {
    try {
      const { lessons } = req.body
      const records = lessons.map(localLessonToFeishu)
      const result = await addRecords(BITABLE_STUDENT, LESSON_TABLE, records)
      res.json({ success: true, count: result?.records?.length || 0 })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.get('/api/sync/lessons/pull', async (req, res) => {
    try {
      const data = await getRecords(BITABLE_STUDENT, LESSON_TABLE, 200)
      const lessons = (data?.items || []).map((r: any) => {
        const f = r.fields
        const startTs = f['开始时间']
        const startTime = startTs
          ? new Date(startTs).toISOString().slice(0, 16).replace('T', ' ').replace(/-/g, '/')
          : ''
        const endTs = f['结束时间']
        const endTime = endTs
          ? new Date(endTs).toISOString().slice(0, 16).replace('T', ' ').replace(/-/g, '/')
          : ''
        return {
          title: `吉他课-${f['学生名称'] || ''}`,
          studentId: 0,
          studentName: f['学生名称'] || '',
          startTime,
          endTime,
          duration: Number(f['时长']) || 1,
          status: f['当前状态'] || '未上课',
          month: f['月份'] || '',
          week: f['周'] || '',
          _feishuId: r.record_id,
        }
      })
      res.json({ success: true, data: lessons })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // ── 课件同步 ──
  app.post('/api/sync/materials/push', async (req, res) => {
    try {
      const { materials } = req.body
      const records = materials.map(localMaterialToFeishu)
      const result = await addRecords(BITABLE_MATERIAL, MATERIAL_TABLE, records)
      res.json({ success: true, count: result?.records?.length || 0 })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  app.get('/api/sync/materials/pull', async (req, res) => {
    try {
      const data = await getRecords(BITABLE_MATERIAL, MATERIAL_TABLE, 200)
      const materials = (data?.items || []).map((r: any) => {
        const f = r.fields
        return {
          content: f['教学内容'] || '',
          category: f['一级分类'] || '演奏技法',
          subcategory: f['二级分类'] || '',
          difficulty: Number(f['难度']) || 1,
          fileLink: f['课件链接'] || '',
          fileName: '',
          targetSpeed: f['目标速度'] || '',
          notes: f['备注'] || '',
          parentId: null,
          _feishuId: r.record_id,
        }
      })
      res.json({ success: true, data: materials })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
