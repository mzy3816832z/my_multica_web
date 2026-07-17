import request from '@/utils/request'
import type { PaginatedData, Apartment, RoomType, RentalPlan } from '@/types'

export interface ApartmentListParams {
  keyword?: string
  district_id?: number
  street_id?: number
  layout_type?: string
  lease_term?: string
  min_price?: number
  max_price?: number
  page?: number
  page_size?: number
}

export function getApartments(params?: ApartmentListParams) {
  return request.get<PaginatedData<Apartment>>('/apartments', { params })
}

export function getApartmentDetail(id: number) {
  return request.get<Apartment>('/apartments/' + id)
}

export function getRoomTypesByApartment(id: number) {
  return request.get<RoomType[]>('/apartments/' + id + '/room-types')
}

export function getRoomTypeDetail(id: number) {
  return request.get<RoomType>('/room-types/' + id)
}
