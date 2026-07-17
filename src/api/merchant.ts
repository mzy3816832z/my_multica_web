import request from '@/utils/request'
import type { Apartment, MerchantAuditItem, MerchantApartmentDetail, PaginatedData } from '@/types'

export interface CreateApartmentPayload {
  name: string
  cover_image: string
  description: string
  district_id: number
  street_id: number
  detail_address: string
  contact_phone: string
  room_types: {
    name: string
    images: string[]
    facilities: string[]
    layout_type: string
    window_type: string
    orientation: string
    floor: number
    rental_plans: {
      lease_term: string
      monthly_rent: number
      payment_method: string
    }[]
  }[]
}

export function createApartment(payload: CreateApartmentPayload) {
  return request.post<{ apartment_id: number; audit_id: number }>('/merchant/apartments', payload)
}

export function getMerchantApartments(params?: { page?: number; page_size?: number }) {
  return request.get<{ items: Apartment[]; total: number; page: number; page_size: number }>('/merchant/apartments', { params })
}

export function getMerchantApartmentDetail(id: number) {
  return request.get<MerchantApartmentDetail>('/merchant/apartments/' + id)
}

export function updateApartment(id: number, payload: CreateApartmentPayload) {
  return request.put('/merchant/apartments/' + id, payload)
}

export function deleteApartment(id: number) {
  return request.delete('/merchant/apartments/' + id)
}

export function getMerchantAudits(params?: { page?: number; page_size?: number }) {
  return request.get<PaginatedData<MerchantAuditItem>>('/merchant/audits', { params })
}
