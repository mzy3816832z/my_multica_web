// 统一响应结构
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页结构
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// 用户
export interface User {
  id: number
  phone: string | null
  username: string | null
  role: 'tenant' | 'landlord' | 'admin' | ''
  is_active: boolean
}

// 登录返回
export interface LoginResult {
  access_token: string
  refresh_token: string
  user: User
}

// 字典项
export interface DictItem {
  code: string
  label: string
  sort: number
}

// 行政区
export interface District {
  id: number
  parent_id: number | null
  name: string
  level: number
  code: string | null
  sort: number
}
