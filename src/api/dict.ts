import request from '@/utils/request'
import type { DictItem, District } from '@/types'

export function getDistricts(params?: { level?: number; parent_id?: number }) {
  return request.get<District[]>('/districts', { params })
}

export function getDicts(category: string) {
  return request.get<DictItem[]>('/dicts', { params: { category } })
}
