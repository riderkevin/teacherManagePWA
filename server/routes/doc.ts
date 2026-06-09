import { Router } from 'express'
import { getDocumentContent, getDocumentBlocks } from '../feishu'

export function setupDocRoutes(app: Router) {
  // 获取文档纯文本内容
  app.get('/api/doc/:docToken/raw', async (req, res) => {
    try {
      const content = await getDocumentContent(req.params.docToken)
      res.json({ success: true, data: content })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 获取文档块
  app.get('/api/doc/:docToken/blocks', async (req, res) => {
    try {
      const blocks = await getDocumentBlocks(req.params.docToken)
      res.json({ success: true, data: blocks })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
