import request from '@/utils/request'
import type { PaginatedData, AuditRecord } from '@/types'

export interface AuditListParams {
  type?: 'first_review' | 'change_review'
  status?: 'pending' | 'approved' | 'rejected'
  page?: number
  page_size?: number
}

export function getAdminAudits(params?: AuditListParams) {
  return request.get<PaginatedData<AuditRecord>>('/admin/audits', { params })
}

export function getAdminAuditDetail(id: number) {
  return request.get<AuditRecord>('/admin/audits/' + id)
}

export function approveAudit(id: number) {
  return request.post('/admin/audits/' + id + '/approve')
}

export function rejectAudit(id: number, reason: string) {
  return request.post('/admin/audits/' + id + '/reject', { reason })
}
