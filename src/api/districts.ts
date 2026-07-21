import request from '@/utils/request'
import type { DictItem, District } from '@/types'

/**
 * 获取行政区划列表
 * @param params - 查询参数
 * @param params.level - 层级：1=省/直辖市，2=市/区
 * @param params.parent_id - 父级ID，level=2 时必须传入
 * @returns Promise<District[]>
 */
export function getDistricts(params?: { level?: number; parent_id?: number }) {
  return request.get<District[]>('/districts', { params })
}

/**
 * 获取字典数据列表
 * @param category - 字典分类标识
 * @returns Promise<DictItem[]>
 *
 * 支持的字典分类：
 * - layout_type    : 户型类型
 * - lease_term     : 租期类型
 * - facility       : 房间设施
 * - payment_method : 支付方式
 * - window_type    : 窗户类型
 * - window_orientation : 窗户朝向
 */
export function getDicts(category: string) {
  return request.get<DictItem[]>('/dicts', { params: { category } })
}
