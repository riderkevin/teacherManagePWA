import { request } from './client'

// ── 后台管理 ──

/** 为某个学生生成绑定码 */
export async function generateBindCode(studentId: number): Promise<{ code: string; studentName: string }> {
  return request('/api/wx/admin/generate-code', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  })
}

/** 查询学生的绑定状态 */
export async function getBindingStatus(studentId: number): Promise<{
  isBound: boolean
  wxOpenid?: string
  wxNickname?: string
  wxAvatarUrl?: string
  boundAt?: string
}> {
  return request(`/api/wx/admin/binding/${studentId}`)
}

/** 解除学生的小程序绑定 */
export async function unbindStudent(studentId: number): Promise<void> {
  await request(`/api/wx/admin/unbind/${studentId}`, { method: 'DELETE' })
}
