import { Router } from 'express'
import { getPrimaryCalendar, getCalendarEvents, createCalendarEvent } from '../feishu'

export function setupCalendarRoutes(app: Router) {
  // 获取主日历
  app.get('/api/calendar/primary', async (_req, res) => {
    try {
      const cal = await getPrimaryCalendar()
      res.json({ success: true, data: cal })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 获取日历事件
  app.get('/api/calendar/:calendarId/events', async (req, res) => {
    try {
      const { start_time, end_time } = req.query
      const events = await getCalendarEvents(
        req.params.calendarId,
        start_time as string,
        end_time as string,
      )
      res.json({ success: true, data: events })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })

  // 创建事件
  app.post('/api/calendar/:calendarId/events', async (req, res) => {
    try {
      const event = await createCalendarEvent(req.params.calendarId, req.body)
      res.json({ success: true, data: event })
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message })
    }
  })
}
