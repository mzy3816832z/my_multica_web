// 字典映射表：审核详情页字典字段中文映射
// 用于后端未返回 label 时的兜底展示

export const layoutTypeMap: Record<string, string> = {
  studio: '单间',
  one_bedroom: '一室一厅',
  two_bedroom: '两室一厅',
  three_bedroom: '三室一厅',
  four_bedroom: '四室一厅',
  shared: '合租',
  dormitory: '宿舍',
  other: '其他',
}

export const windowTypeMap: Record<string, string> = {
  inner: '内窗',
  outer: '外窗',
  none: '无窗',
  bay: '飘窗',
  floor_to_ceiling: '落地窗',
}

export const orientationMap: Record<string, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  southeast: '东南',
  northeast: '东北',
  southwest: '西南',
  northwest: '西北',
}

export const facilityMap: Record<string, string> = {
  air_conditioner: '空调',
  washing_machine: '洗衣机',
  refrigerator: '冰箱',
  water_heater: '热水器',
  bed: '床',
  wardrobe: '衣柜',
  desk: '书桌',
  chair: '椅子',
  sofa: '沙发',
  tv: '电视',
  wifi: 'WiFi',
  balcony: '阳台',
  kitchen: '厨房',
  bathroom: '独立卫生间',
  elevator: '电梯',
  parking: '停车位',
  smart_lock: '智能门锁',
  heating: '暖气',
}

export const leaseTermMap: Record<string, string> = {
  '1_month': '1个月',
  '3_months': '3个月',
  '6_months': '6个月',
  '1_year': '1年',
  '2_years': '2年',
}

export const paymentMethodMap: Record<string, string> = {
  no_deposit: '押一付一',
  one_deposit: '押一付三',
  two_deposit: '押二付一',
  half_year: '半年付',
  yearly: '年付',
}

// 通用映射查找函数
export function mapDict(
  value: string | undefined,
  map: Record<string, string>
): string {
  if (!value) return '-'
  return map[value] || value
}

// 设施列表映射
export function mapFacilities(facilities: string[] | undefined): string {
  if (!facilities || facilities.length === 0) return '-'
  return facilities.map((f) => facilityMap[f] || f).join('、')
}
