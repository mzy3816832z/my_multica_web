import request from '@/utils/request'
import type { PaginatedData, Apartment } from '@/types'

export function getFavorites(params?: { page?: number; page_size?: number }) {
  return request.get<PaginatedData<Apartment>>('/favorites', { params })
}

export function addFavorite(apartmentId: number) {
  return request.post('/favorites', { apartment_id: apartmentId })
}

export function removeFavorite(apartmentId: number) {
  return request.delete('/favorites/' + apartmentId)
}
