import request from '@/utils/request'
import type { LoginResult, User } from '@/types'

export function sendSmsCode(phone: string, purpose: string) {
  return request.post('/auth/sms-code', { phone, purpose })
}

export function register(data: { phone: string; sms_code: string; password: string }) {
  return request.post('/auth/register', data)
}

export function loginByPassword(data: { phone: string; password: string }) {
  return request.post<LoginResult>('/auth/login-by-password', data) as unknown as Promise<LoginResult>
}

export function loginByCode(data: { phone: string; sms_code: string }) {
  return request.post<LoginResult>('/auth/login-by-code', data) as unknown as Promise<LoginResult>
}

export function selectRole(role: 'tenant' | 'landlord') {
  return request.post<User>('/auth/select-role', { role }) as unknown as Promise<User>
}

export function resetPassword(data: { phone: string; sms_code: string; new_password: string }) {
  return request.post('/auth/reset-password', data)
}

export function changePassword(data: { sms_code: string; new_password: string }) {
  return request.post('/auth/change-password', data)
}

export function adminLogin(data: { username: string; password: string }) {
  return request.post<LoginResult>('/auth/admin-login', data)
}

export function getMe() {
  return request.get<User>('/auth/me')
}
