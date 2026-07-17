import request from '@/utils/request'
import type { PaginatedData, Message } from '@/types'

export function getMessages(params?: { page?: number; page_size?: number }) {
  return request.get<PaginatedData<Message>>('/messages', { params })
}

export function markMessageRead(id: number) {
  return request.post('/messages/' + id + '/read', {})
}

export function getUnreadCount() {
  return request.get<{ count: number }>('/messages/unread-count')
}
