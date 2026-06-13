import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import studentsRoutes from './routes/students'
import lessonsRoutes from './routes/lessons'
import materialsRoutes from './routes/materials'
import paymentsRoutes from './routes/payments'
import lessonMaterialsRoutes from './routes/lessonMaterials'
import statsRoutes from './routes/stats'
import seedRoutes from './routes/seed'
import wxRoutes from './routes/wx'
import bandRoutes from './routes/band'
import cloudFilesRoutes from './routes/cloudFiles'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ── 健康检查 ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Teacher API' })
})

// ── 数据 API 路由 ──
app.use('/api/auth', authRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/lessons', lessonsRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/lesson-materials', lessonMaterialsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/wx', wxRoutes)
app.use('/api/band', bandRoutes)
app.use('/api/cloud-files', cloudFilesRoutes)

// ── 生产环境：托管前端静态文件 ──
import path from 'path'
import fs from 'fs'
const distPath = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // SPA 路由回退：非 /api 路径都返回 index.html
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Teacher API 已启动: http://localhost:${PORT}`)
})
