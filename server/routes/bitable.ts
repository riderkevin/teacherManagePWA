import { Router } from 'express'
import { listTables, listFields, getRecords, addRecords, updateRecords, deleteRecords } from '../feishu'

export function setupBitableRoutes(app: Router) {
  // 列出数据表
  app.get('/api/bitable/:appToken/tables', async (req, res) => {
    try {
      const tables = await listTables(req.params.appToken)
      res.json({ success: true, data: tables })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 获取字段
  app.get('/api/bitable/:appToken/tables/:tableId/fields', async (req, res) => {
    try {
      const fields = await listFields(req.params.appToken, req.params.tableId)
      res.json({ success: true, data: fields })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 获取记录
  app.get('/api/bitable/:appToken/tables/:tableId/records', async (req, res) => {
    try {
      const records = await getRecords(req.params.appToken, req.params.tableId, 100, req.query.page_token as string)
      res.json({ success: true, data: records })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 新增记录
  app.post('/api/bitable/:appToken/tables/:tableId/records', async (req, res) => {
    try {
      const { records } = req.body
      const result = await addRecords(req.params.appToken, req.params.tableId, records)
      res.json({ success: true, data: result })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 更新记录
  app.put('/api/bitable/:appToken/tables/:tableId/records', async (req, res) => {
    try {
      const { records } = req.body
      const result = await updateRecords(req.params.appToken, req.params.tableId, records)
      res.json({ success: true, data: result })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 删除记录
  app.delete('/api/bitable/:appToken/tables/:tableId/records', async (req, res) => {
    try {
      const { recordIds } = req.body
      const result = await deleteRecords(req.params.appToken, req.params.tableId, recordIds)
      res.json({ success: true, data: result })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
