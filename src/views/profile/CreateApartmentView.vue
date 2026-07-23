<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { createApartment } from '@/api/merchant'
import { uploadImage } from '@/api/upload'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

// ================= 表单数据 =================
const form = reactive({
  name: '',
  cover_image: '',
  description: '',
  district_id: undefined as number | undefined,
  street_id: undefined as number | undefined,
  detail_address: '',
  contact_phone: '',
  room_types: [] as RoomTypeFormItem[],
})

interface RoomTypeFormItem {
  id?: number // 仅前端使用，用于编辑时标识
  name: string
  images: string[]
  facilities: string[]
  layout_type: string
  window_type: string
  floor: number | undefined
  rental_plans: RentalPlanFormItem[]
}

interface RentalPlanFormItem {
  lease_term: string
  monthly_rent: number | undefined
  payment_method: string
}

// ================= 表单校验错误 =================
const formErrors = reactive<Record<string, string>>({})
const roomFormErrors = reactive<Record<string, string>>({})
const rentalPlanErrors = ref<Record<number, Record<string, string>>>({})

function clearRentalPlanError(planIdx: number, field: string) {
  if (rentalPlanErrors.value[planIdx]) {
    delete rentalPlanErrors.value[planIdx][field]
    if (Object.keys(rentalPlanErrors.value[planIdx]).length === 0) {
      delete rentalPlanErrors.value[planIdx]
    }
  }
}

// 主表单字段变更时清除对应错误
watch(() => form.name, () => { delete formErrors.name })
watch(() => form.cover_image, () => { delete formErrors.cover_image })
watch(() => form.description, () => { delete formErrors.description })
watch(() => form.district_id, () => { delete formErrors.district_id })
watch(() => form.street_id, () => { delete formErrors.street_id })
watch(() => form.detail_address, () => { delete formErrors.detail_address })
watch(() => form.contact_phone, () => { delete formErrors.contact_phone })
watch(() => form.room_types.length, () => { if (form.room_types.length > 0) delete formErrors.room_types })

// ================= 行政区级联值绑定 =================
const districtValue = ref<{ district_id?: number; street_id?: number }>({
  district_id: form.district_id,
  street_id: form.street_id,
})

watch(districtValue, (val) => {
  form.district_id = val.district_id
  form.street_id = val.street_id
}, { deep: true })

// ================= 图片上传 =================
const coverUploader = ref<HTMLInputElement | null>(null)
const uploadingCover = ref(false)

function triggerCoverUpload() {
  coverUploader.value?.click()
}

async function onCoverChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showToast('仅支持 jpg/png/webp 格式')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过 5MB')
    return
  }

  uploadingCover.value = true
  try {
    const res = await uploadImage(file)
    form.cover_image = res.url
    showToast('上传成功')
  } catch {
    // 错误已在 request 拦截器中 toast
  } finally {
    uploadingCover.value = false
    target.value = ''
  }
}

function removeCover() {
  form.cover_image = ''
}

// ================= 房型弹窗 =================
const showRoomModal = ref(false)
const isEditingRoom = ref(false)
const editingRoomIndex = ref(-1)

const roomForm = reactive<RoomTypeFormItem>({
  name: '',
  images: [],
  facilities: [],
  layout_type: '',
  window_type: '',
  floor: undefined,
  rental_plans: [],
})

// 房型表单字段变更时清除对应错误
watch(() => roomForm.name, () => { delete roomFormErrors.name })
watch(() => roomForm.images.length, () => { if (roomForm.images.length > 0) delete roomFormErrors.images })
watch(() => roomForm.layout_type, () => { delete roomFormErrors.layout_type })
watch(() => roomForm.window_type, () => { delete roomFormErrors.window_type })
watch(() => roomForm.floor, () => { delete roomFormErrors.floor })
watch(() => roomForm.rental_plans.length, () => { if (roomForm.rental_plans.length > 0) delete roomFormErrors.rental_plans })

const roomImageUploader = ref<HTMLInputElement | null>(null)
const uploadingRoomImage = ref(false)

function openAddRoom() {
  isEditingRoom.value = false
  editingRoomIndex.value = -1
  resetRoomForm()
  showRoomModal.value = true
}

function openEditRoom(index: number) {
  isEditingRoom.value = true
  editingRoomIndex.value = index
  const room = form.room_types[index]
  Object.assign(roomForm, {
    name: room.name,
    images: [...room.images],
    facilities: [...room.facilities],
    layout_type: room.layout_type,
    window_type: room.window_type,
    floor: room.floor,
    rental_plans: room.rental_plans.map(p => ({ ...p })),
  })
  showRoomModal.value = true
}

function resetRoomForm() {
  roomForm.name = ''
  roomForm.images = []
  roomForm.facilities = []
  roomForm.layout_type = ''
  roomForm.window_type = ''
  roomForm.floor = undefined
  roomForm.rental_plans = []
  Object.keys(roomFormErrors).forEach(k => delete roomFormErrors[k])
  rentalPlanErrors.value = {}
}

function closeRoomModal() {
  showRoomModal.value = false
}

// 房型图片上传
function triggerRoomImageUpload() {
  if (roomForm.images.length >= 5) {
    showToast('最多上传 5 张图片')
    return
  }
  roomImageUploader.value?.click()
}

async function onRoomImageChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length === 0) return

  const remainingSlots = 5 - roomForm.images.length
  if (files.length > remainingSlots) {
    showToast(`最多上传 5 张图片，当前还可上传 ${remainingSlots} 张`)
    target.value = ''
    return
  }

  const validFiles = files.filter(file => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(`${file.name} 格式不支持，已跳过`)
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`${file.name} 超过 5MB，已跳过`)
      return false
    }
    return true
  }).slice(0, remainingSlots)

  if (validFiles.length === 0) {
    target.value = ''
    return
  }

  uploadingRoomImage.value = true
  let successCount = 0
  try {
    for (const file of validFiles) {
      try {
        const res = await uploadImage(file)
        roomForm.images.push(res.url)
        successCount++
      } catch {
        showToast(`${file.name} 上传失败`)
      }
    }
    if (successCount > 0) {
      showToast(successCount === validFiles.length
        ? `成功上传 ${successCount} 张图片`
        : `${successCount} 张上传成功，${validFiles.length - successCount} 张失败`)
    }
  } catch {
    // 错误已在 request 拦截器中 toast
  } finally {
    uploadingRoomImage.value = false
    target.value = ''
  }
}

function removeRoomImage(index: number) {
  roomForm.images.splice(index, 1)
}

// 租金方案
function addRentalPlan() {
  roomForm.rental_plans.push({
    lease_term: '',
    monthly_rent: undefined,
    payment_method: '',
  })
}

function removeRentalPlan(index: number) {
  roomForm.rental_plans.splice(index, 1)
}

// 保存房型
function saveRoom() {
  Object.keys(roomFormErrors).forEach(k => delete roomFormErrors[k])
  rentalPlanErrors.value = {}
  let hasError = false

  if (!roomForm.name.trim()) {
    roomFormErrors.name = '请输入房型名称'
    hasError = true
  }
  if (roomForm.images.length === 0) {
    roomFormErrors.images = '请至少上传 1 张房型图片'
    hasError = true
  }
  if (!roomForm.layout_type) {
    roomFormErrors.layout_type = '请选择户型'
    hasError = true
  }
  if (!roomForm.window_type) {
    roomFormErrors.window_type = '请选择窗户类型'
    hasError = true
  }
  if (roomForm.floor === undefined || roomForm.floor === null) {
    roomFormErrors.floor = '请输入楼层'
    hasError = true
  }
  if (roomForm.rental_plans.length === 0) {
    roomFormErrors.rental_plans = '请至少添加 1 组租金方案'
    hasError = true
  }
  for (let i = 0; i < roomForm.rental_plans.length; i++) {
    const plan = roomForm.rental_plans[i]
    if (!plan.lease_term) {
      if (!rentalPlanErrors.value[i]) rentalPlanErrors.value[i] = {}
      rentalPlanErrors.value[i].lease_term = '请选择租期'
      hasError = true
    }
    if (!plan.monthly_rent || plan.monthly_rent <= 0) {
      if (!rentalPlanErrors.value[i]) rentalPlanErrors.value[i] = {}
      rentalPlanErrors.value[i].monthly_rent = '请输入有效的月租金'
      hasError = true
    }
    if (!plan.payment_method) {
      if (!rentalPlanErrors.value[i]) rentalPlanErrors.value[i] = {}
      rentalPlanErrors.value[i].payment_method = '请选择支付方式'
      hasError = true
    }
  }

  if (hasError) {
    showToast('请完善房型信息')
    return
  }

  const roomData: RoomTypeFormItem = {
    name: roomForm.name.trim(),
    images: [...roomForm.images],
    facilities: [...roomForm.facilities],
    layout_type: roomForm.layout_type,
    window_type: roomForm.window_type,
    floor: Number(roomForm.floor),
    rental_plans: roomForm.rental_plans.map(p => ({
      lease_term: p.lease_term,
      monthly_rent: Number(p.monthly_rent),
      payment_method: p.payment_method,
    })),
  }

  if (isEditingRoom.value && editingRoomIndex.value >= 0) {
    form.room_types[editingRoomIndex.value] = roomData
  } else {
    form.room_types.push(roomData)
  }

  showToast(isEditingRoom.value ? '房型已更新' : '房型已添加')
  closeRoomModal()
}

// 删除房型
async function removeRoomType(index: number) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除该房型吗？',
    })
    form.room_types.splice(index, 1)
    showToast('已删除')
  } catch {
    // 取消删除
  }
}

// ================= 表单校验与提交 =================
const canSubmit = computed(() => {
  return (
    form.name.trim() &&
    form.cover_image &&
    form.description.trim() &&
    form.district_id !== undefined &&
    form.street_id !== undefined &&
    form.detail_address.trim() &&
    form.contact_phone.trim() &&
    form.room_types.length > 0
  )
})

async function onSubmit() {
  Object.keys(formErrors).forEach(k => delete formErrors[k])
  let hasError = false

  if (!form.name.trim()) {
    formErrors.name = '请输入公寓名称'
    hasError = true
  } else if (form.name.trim().length < 2 || form.name.trim().length > 50) {
    formErrors.name = '公寓名称需在 2-50 字之间'
    hasError = true
  }
  if (!form.cover_image) {
    formErrors.cover_image = '请上传公寓总览图'
    hasError = true
  }
  if (!form.description.trim()) {
    formErrors.description = '请输入公寓描述'
    hasError = true
  } else if (form.description.trim().length > 500) {
    formErrors.description = '公寓描述不能超过 500 字'
    hasError = true
  }
  if (form.district_id === undefined) {
    formErrors.district_id = '请选择行政区'
    hasError = true
  }
  if (form.street_id === undefined) {
    formErrors.street_id = '请选择街道/镇'
    hasError = true
  }
  if (!form.detail_address.trim()) {
    formErrors.detail_address = '请输入详细门牌号'
    hasError = true
  }
  if (!form.contact_phone.trim()) {
    formErrors.contact_phone = '请输入联系电话'
    hasError = true
  } else if (!/^1[3-9]\d{9}$/.test(form.contact_phone.trim())) {
    formErrors.contact_phone = '请输入正确的手机号码'
    hasError = true
  }
  if (form.room_types.length === 0) {
    formErrors.room_types = '请至少添加 1 组房型'
    hasError = true
  }

  if (hasError) {
    showToast('请完善公寓信息')
    return
  }

  uiStore.showLoading('提交中...')
  try {
    const payload = {
      name: form.name.trim(),
      cover_image: form.cover_image,
      description: form.description.trim(),
      district_id: form.district_id as number,
      street_id: form.street_id as number,
      detail_address: form.detail_address.trim(),
      contact_phone: form.contact_phone.trim(),
      room_types: form.room_types.map(r => ({
        name: r.name,
        images: r.images,
        facilities: r.facilities,
        layout_type: r.layout_type,
        window_type: r.window_type,
        floor: r.floor as number,
        rental_plans: r.rental_plans.map(p => ({
          lease_term: p.lease_term,
          monthly_rent: p.monthly_rent as number,
          payment_method: p.payment_method,
        })),
      })),
    }
    await createApartment(payload)
    showToast('提交成功，等待审核')
    router.replace('/profile/my-apartments')
  } catch {
    // 错误已在 request 拦截器中 toast
  } finally {
    uiStore.hideLoading()
  }
}

</script>

<template>
  <div class="create-apartment-page">
    <!-- 顶部导航 -->
    <van-nav-bar title="发布房源" left-arrow @click-left="router.back()" fixed placeholder />

    <!-- 表单内容 -->
    <div class="p-4 space-y-4">
      <!-- 公寓名称 -->
      <div class="bg-white rounded-xl p-4">
        <div class="text-sm font-bold text-gray-900 mb-2">公寓名称 <span class="text-danger">*</span></div>
        <van-field
          v-model="form.name"
          placeholder="请输入公寓名称（2-50字）"
          maxlength="50"
          show-word-limit
          :border="false"
          class="bg-gray-50 rounded-lg"
        />
        <div v-if="formErrors.name" class="text-danger text-xs mt-1">{{ formErrors.name }}</div>
      </div>

      <!-- 总览图上传 -->
      <div class="bg-white rounded-xl p-4">
        <div class="text-sm font-bold text-gray-900 mb-2">公寓总览图 <span class="text-danger">*</span></div>
        <div v-if="form.cover_image" class="relative w-full h-44 rounded-lg overflow-hidden">
          <van-image :src="form.cover_image" fit="cover" class="w-full h-full" />
          <div class="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center" @click="removeCover">
            <van-icon name="cross" class="text-white text-sm" />
          </div>
        </div>
        <div
          v-else
          class="w-full h-44 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300"
          @click="triggerCoverUpload"
        >
          <van-icon v-if="uploadingCover" name="loading" class="text-primary text-2xl animate-spin" />
          <template v-else>
            <van-icon name="photograph" class="text-gray-400 text-2xl mb-2" />
            <span class="text-sm text-gray-400">点击上传总览图</span>
          </template>
        </div>
        <input ref="coverUploader" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onCoverChange" />
        <div v-if="formErrors.cover_image" class="text-danger text-xs mt-1">{{ formErrors.cover_image }}</div>
      </div>

      <!-- 公寓描述 -->
      <div class="bg-white rounded-xl p-4">
        <div class="text-sm font-bold text-gray-900 mb-2">公寓描述 <span class="text-danger">*</span></div>
        <van-field
          v-model="form.description"
          type="textarea"
          rows="4"
          placeholder="请输入公寓描述（不超过500字）"
          maxlength="500"
          show-word-limit
          :border="false"
          class="bg-gray-50 rounded-lg"
        />
        <div v-if="formErrors.description" class="text-danger text-xs mt-1">{{ formErrors.description }}</div>
      </div>

      <!-- 所在位置 -->
      <div class="bg-white rounded-xl p-4 space-y-3">
        <div class="text-sm font-bold text-gray-900">所在位置 <span class="text-danger">*</span></div>
        <DistrictCascader v-model="districtValue" />
        <div v-if="formErrors.district_id" class="text-danger text-xs mt-1">{{ formErrors.district_id }}</div>
        <div v-if="formErrors.street_id" class="text-danger text-xs mt-1">{{ formErrors.street_id }}</div>
        <van-field
          v-model="form.detail_address"
          placeholder="请输入详细门牌号"
          :border="false"
          class="bg-gray-50 rounded-lg"
        />
        <div v-if="formErrors.detail_address" class="text-danger text-xs mt-1">{{ formErrors.detail_address }}</div>
      </div>

      <!-- 联系电话 -->
      <div class="bg-white rounded-xl p-4">
        <div class="text-sm font-bold text-gray-900 mb-2">联系电话 <span class="text-danger">*</span></div>
        <van-field
          v-model="form.contact_phone"
          type="tel"
          placeholder="请输入联系电话"
          maxlength="11"
          :border="false"
          class="bg-gray-50 rounded-lg"
        />
        <div v-if="formErrors.contact_phone" class="text-danger text-xs mt-1">{{ formErrors.contact_phone }}</div>
      </div>

      <!-- 房型列表 -->
      <div class="bg-white rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-bold text-gray-900">房型 <span class="text-danger">*</span></div>
          <span class="text-xs text-gray-400">至少添加 1 组</span>
        </div>

        <!-- 已添加房型卡片 -->
        <div v-if="form.room_types.length > 0" class="space-y-3 mb-3">
          <div
            v-for="(room, index) in form.room_types"
            :key="index"
            class="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
          >
            <van-image
              :src="room.images[0]"
              fit="cover"
              class="w-16 h-16 rounded-lg flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold text-gray-900 truncate">{{ room.name }}</div>
              <div class="text-xs text-gray-500 mt-1">
                {{ room.floor }}层 · {{ room.rental_plans.length }} 组方案
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <van-icon name="edit" class="text-primary text-lg" @click="openEditRoom(index)" />
              <van-icon name="delete-o" class="text-danger text-lg" @click="removeRoomType(index)" />
            </div>
          </div>
        </div>

        <!-- 添加房型按钮 -->
        <van-button type="primary" plain block round icon="plus" @click="openAddRoom">
          添加房型
        </van-button>
        <div v-if="formErrors.room_types" class="text-danger text-xs mt-2">{{ formErrors.room_types }}</div>
      </div>

      <!-- 提交按钮 -->
      <div class="pt-2 pb-6">
        <van-button type="primary" block round :disabled="!canSubmit" @click="onSubmit">
          提交审核
        </van-button>
      </div>
    </div>

    <!-- 房型弹窗 -->
    <van-popup v-model:show="showRoomModal" position="bottom" round :style="{ height: '90%' }" class="room-modal">
      <div class="flex flex-col h-full">
        <!-- 弹窗头部 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span class="text-base font-bold">{{ isEditingRoom ? '编辑房型' : '添加房型' }}</span>
          <van-icon name="cross" class="text-gray-400 text-lg" @click="closeRoomModal" />
        </div>

        <!-- 弹窗内容 -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- 房型名称 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">房型名称 <span class="text-danger">*</span></div>
            <van-field
              v-model="roomForm.name"
              placeholder="如：标准单间、豪华套房"
              maxlength="50"
              :border="false"
              class="bg-gray-50 rounded-lg"
            />
            <div v-if="roomFormErrors.name" class="text-danger text-xs mt-1">{{ roomFormErrors.name }}</div>
          </div>

          <!-- 房型图片 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">
              房型图片 <span class="text-danger">*</span>
              <span class="text-xs text-gray-400 font-normal">（最多 5 张）</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(img, idx) in roomForm.images"
                :key="idx"
                class="relative w-20 h-20 rounded-lg overflow-hidden"
              >
                <van-image :src="img" fit="cover" class="w-full h-full" />
                <div class="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center" @click="removeRoomImage(idx)">
                  <van-icon name="cross" class="text-white text-xs" />
                </div>
              </div>
              <div
                v-if="roomForm.images.length < 5"
                class="w-20 h-20 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300"
                @click="triggerRoomImageUpload"
              >
                <van-icon v-if="uploadingRoomImage" name="loading" class="text-primary animate-spin" />
                <template v-else>
                  <van-icon name="photograph" class="text-gray-400 text-lg" />
                  <span class="text-xs text-gray-400 mt-1">上传</span>
                </template>
                <span v-if="uploadingRoomImage" class="text-xs text-primary mt-1">上传中</span>
              </div>
            </div>
            <input ref="roomImageUploader" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="onRoomImageChange" />
            <div v-if="roomFormErrors.images" class="text-danger text-xs mt-1">{{ roomFormErrors.images }}</div>
          </div>

          <!-- 户型 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">户型 <span class="text-danger">*</span></div>
            <DictSelect category="layout_type" v-model="roomForm.layout_type" placeholder="请选择户型" title="选择户型" />
            <div v-if="roomFormErrors.layout_type" class="text-danger text-xs mt-1">{{ roomFormErrors.layout_type }}</div>
          </div>

          <!-- 窗户类型 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">窗户类型 <span class="text-danger">*</span></div>
            <DictSelect category="window_type" v-model="roomForm.window_type" placeholder="请选择窗户类型" title="选择窗户类型" />
            <div v-if="roomFormErrors.window_type" class="text-danger text-xs mt-1">{{ roomFormErrors.window_type }}</div>
          </div>

          <!-- 楼层 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">楼层 <span class="text-danger">*</span></div>
            <van-field
              v-model.number="roomForm.floor"
              type="digit"
              placeholder="请输入楼层"
              :border="false"
              class="bg-gray-50 rounded-lg"
            />
            <div v-if="roomFormErrors.floor" class="text-danger text-xs mt-1">{{ roomFormErrors.floor }}</div>
          </div>

          <!-- 设施 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">设施</div>
            <DictSelect category="facility" v-model="roomForm.facilities" multiple placeholder="请选择设施" title="选择设施" />
          </div>

          <!-- 租金方案 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-bold text-gray-900">租金方案 <span class="text-danger">*</span></div>
              <span class="text-xs text-primary" @click="addRentalPlan">+ 添加方案</span>
            </div>
            <div v-if="roomForm.rental_plans.length === 0" class="text-sm text-gray-400 py-4 text-center">
              暂无租金方案，点击上方添加
            </div>
            <div v-if="roomFormErrors.rental_plans" class="text-danger text-xs mt-1">{{ roomFormErrors.rental_plans }}</div>
            <div v-else class="space-y-3">
              <div
                v-for="(plan, idx) in roomForm.rental_plans"
                :key="idx"
                class="bg-gray-50 rounded-lg p-3 space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-gray-900">方案 {{ idx + 1 }}</span>
                  <van-icon name="delete-o" class="text-danger" @click="removeRentalPlan(idx)" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 w-16 flex-shrink-0">租期</span>
                  <div class="flex-1">
                    <DictSelect category="lease_term" v-model="plan.lease_term" placeholder="请选择" class="flex-1" />
                    <div v-if="rentalPlanErrors[idx]?.lease_term" class="text-danger text-xs mt-1">{{ rentalPlanErrors[idx].lease_term }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 w-16 flex-shrink-0">月租金</span>
                  <div class="flex-1">
                    <van-field
                      v-model.number="plan.monthly_rent"
                      type="digit"
                      placeholder="请输入月租金（元）"
                      :border="false"
                      class="flex-1 bg-white rounded-lg"
                    />
                    <div v-if="rentalPlanErrors[idx]?.monthly_rent" class="text-danger text-xs mt-1">{{ rentalPlanErrors[idx].monthly_rent }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 w-16 flex-shrink-0">支付方式</span>
                  <div class="flex-1">
                    <DictSelect category="payment_method" v-model="plan.payment_method" placeholder="请选择" class="flex-1" />
                    <div v-if="rentalPlanErrors[idx]?.payment_method" class="text-danger text-xs mt-1">{{ rentalPlanErrors[idx].payment_method }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 弹窗底部 -->
        <div class="p-4 border-t border-gray-100 safe-area-bottom">
          <van-button type="primary" block round @click="saveRoom">
            {{ isEditingRoom ? '保存修改' : '确认添加' }}
          </van-button>
        </div>
      </div>
    </van-popup>

  </div>
</template>

<style scoped lang="scss">
.create-apartment-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.text-danger {
  color: $danger;
}

.text-primary {
  color: $primary;
}

.room-modal {
  :deep(.van-popup__content) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

:deep(.van-field) {
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 8px 12px;
}

:deep(.van-field__word-limit) {
  color: #969799;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
