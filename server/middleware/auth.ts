import type { Request, Response, NextFunction } from 'express'
import * as repo from '../db/repository'

// 简单的 token 认证中间件
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 如果是首次使用（未设置密码），跳过认证
  if (repo.isFirstTime()) {
    ;(req as any).token = 'first-time'
    next()
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' })
    return
  }

  const token = authHeader.slice(7)
  if (!repo.validateSession(token)) {
    res.status(401).json({ error: '登录已过期，请重新登录' })
    return
  }

  ;(req as any).token = token
  next()
}
