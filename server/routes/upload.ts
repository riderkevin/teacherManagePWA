import type { Express, Request, Response } from 'express'
import axios from 'axios'
import FormData from 'form-data'
import { getAccessToken } from '../feishu'

const FEISHU_API = 'https://open.feishu.cn/open-apis'

export function setupUploadRoutes(app: Express) {
  app.post('/api/upload/file', async (req: Request, res: Response) => {
    try {
      const { fileName, fileData } = req.body as { fileName?: string; fileData?: string }

      if (!fileName || !fileData) {
        res.status(400).json({ error: '缺少 fileName 或 fileData' })
        return
      }

      // base64 → Buffer
      const base64 = fileData.replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(base64, 'base64')
      console.log(`📤 准备上传: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`)

      const token = await getAccessToken()

      // 只用 medias/upload_all 上传（更简单，不涉及文件夹）
      const form = new FormData()
      form.append('file_name', fileName)
      form.append('parent_type', 'docx_file')
      form.append('parent_node', '')
      form.append('size', String(buffer.length))
      form.append('file', buffer, { filename: fileName })

      console.log('→ 发送上传请求...')
      const { data } = await axios.post(
        `${FEISHU_API}/drive/v1/medias/upload_all`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...form.getHeaders(),
          },
          timeout: 60000,
        },
      )

      console.log('← 飞书响应:', JSON.stringify({ code: data.code, msg: data.msg }))

      if (data.code !== 0) {
        res.status(500).json({ error: `飞书上传失败 [${data.code}]: ${data.msg}` })
        return
      }

      const fileToken = data.data?.file_token
      console.log(`✅ 上传成功 file_token: ${fileToken}`)

      res.json({
        fileToken,
        fileName,
        url: `${FEISHU_API}/drive/v1/medias/${fileToken}/download`,
      })
    } catch (err: any) {
      if (err.response) {
        console.error('飞书响应错误:', err.response.status, JSON.stringify(err.response.data))
        res.status(500).json({ error: `飞书错误 ${err.response.status}: ${JSON.stringify(err.response.data)}` })
      } else {
        console.error('上传异常:', err.message)
        res.status(500).json({ error: err.message })
      }
    }
  })
}
