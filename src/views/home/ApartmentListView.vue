<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApartments } from '@/api/apartment'
import { getDistricts } from '@/api/dict'
import { addFavorite, removeFavorite } from '@/api/favorite'
import type { Apartment, District, DictItem } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

// ================= 列表数据 =================
const list = ref<Apartment[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

// ================= 搜索 =================
const keyword = ref('')
const showSearch = ref(false)

// ================= 筛选 =================
const showFilter = ref(false)

const filter = reactive({
  district_id: undefined as number | undefined,
  street_id: undefined as number | undefined,
  layout_type: '',
  lease_term: '',
  min_price: undefined as number | undefined,
  max_price: undefined as number | undefined,
})

// 行政区静态映射（上海16区）
const districts = ref<District[]>([
  { id: 1, name: '黄浦区', parent_id: null, level: 1, code: null, sort: 1 },
  { id: 2, name: '静安区', parent_id: null, level: 1, code: null, sort: 2 },
  { id: 3, name: '徐汇区', parent_id: null, level: 1, code: null, sort: 3 },
  { id: 4, name: '长宁区', parent_id: null, level: 1, code: null, sort: 4 },
  { id: 5, name: '普陀区', parent_id: null, level: 1, code: null, sort: 5 },
  { id: 6, name: '虹口区', parent_id: null, level: 1, code: null, sort: 6 },
  { id: 7, name: '杨浦区', parent_id: null, level: 1, code: null, sort: 7 },
  { id: 8, name: '浦东新区', parent_id: null, level: 1, code: null, sort: 8 },
  { id: 9, name: '闵行区', parent_id: null, level: 1, code: null, sort: 9 },
  { id: 10, name: '宝山区', parent_id: null, level: 1, code: null, sort: 10 },
  { id: 11, name: '嘉定区', parent_id: null, level: 1, code: null, sort: 11 },
  { id: 12, name: '金山区', parent_id: null, level: 1, code: null, sort: 12 },
  { id: 13, name: '松江区', parent_id: null, level: 1, code: null, sort: 13 },
  { id: 14, name: '青浦区', parent_id: null, level: 1, code: null, sort: 14 },
  { id: 15, name: '奉贤区', parent_id: null, level: 1, code: null, sort: 15 },
  { id: 16, name: '崇明区', parent_id: null, level: 1, code: null, sort: 16 },
])

const streets = ref<District[]>([])

// 户型静态映射
const layoutTypes = ref<DictItem[]>([
  { code: 'studio', label: '一室', sort: 1 },
  { code: 'one_bedroom', label: '一室一厅', sort: 2 },
  { code: 'two_bedroom', label: '两室一厅', sort: 3 },
  { code: 'two_bedroom_2', label: '两室两厅', sort: 4 },
  { code: 'three_bedroom', label: '三室一厅', sort: 5 },
  { code: 'three_bedroom_2', label: '三室两厅', sort: 6 },
  { code: 'loft', label: 'LOFT', sort: 7 },
  { code: 'duplex', label: '复式', sort: 8 },
])

// 租期静态映射
const leaseTerms = ref<DictItem[]>([
  { code: '1_month', label: '1个月', sort: 1 },
  { code: '3_months', label: '3个月', sort: 2 },
  { code: '6_months', label: '半年', sort: 3 },
  { code: '1_year', label: '1年', sort: 4 },
  { code: '18_months', label: '18个月', sort: 5 },
  { code: '2_years', label: '2年', sort: 6 },
])

const streetsLoading = ref(false)
const streetsError = ref('')

const activeFilterCount = computed(() => {
  let count = 0
  if (filter.district_id !== undefined) count++
  if (filter.street_id !== undefined) count++
  if (filter.layout_type) count++
  if (filter.lease_term) count++
  if (filter.min_price !== undefined || filter.max_price !== undefined) count++
  return count
})

// ================= 加载街道数据（保留接口调用） =================
async function loadStreets(parentId: number) {
  streetsLoading.value = true
  streetsError.value = ''
  try {
    const res = await getDistricts({ level: 2, parent_id: parentId })
    streets.value = res
  } catch {
    streetsError.value = '加载街道失败'
  } finally {
    streetsLoading.value = false
  }
}

watch(() => filter.district_id, (val) => {
  filter.street_id = undefined
  streets.value = []
  if (val) {
    loadStreets(val)
  }
})

// ================= 加载列表 =================
async function fetchList(isRefresh = false) {
  if (loading.value) return
  loading.value = true
  try {
    const currentPage = isRefresh ? 1 : page.value
    const params = {
      keyword: keyword.value || undefined,
      district_id: filter.district_id,
      street_id: filter.street_id,
      layout_type: filter.layout_type || undefined,
      lease_term: filter.lease_term || undefined,
      min_price: filter.min_price,
      max_price: filter.max_price,
      page: currentPage,
      page_size: pageSize.value,
    }
    const data = await getApartments(params)
    if (isRefresh) {
      list.value = data.items
      page.value = 1
    } else {
      list.value.push(...data.items)
    }
    total.value = data.total
    finished.value = list.value.length >= data.total
    if (!isRefresh) {
      page.value++
    }
  } catch {
    // 错误已在 request 拦截器中 toast
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onLoad() {
  fetchList()
}

function onRefresh() {
  finished.value = false
  fetchList(true)
}

function onSearch() {
  showSearch.value = false
  onRefresh()
}

function onFilterConfirm() {
  showFilter.value = false
  onRefresh()
}

function onFilterReset() {
  filter.district_id = undefined
  filter.street_id = undefined
  filter.layout_type = ''
  filter.lease_term = ''
  filter.min_price = undefined
  filter.max_price = undefined
  streets.value = []
}

function onFilterClear() {
  onFilterReset()
  onFilterConfirm()
}

function goDetail(id: number) {
  router.push('/apartments/' + id)
}

function goCreate() {
  router.push('/profile/apartments/create')
}

async function toggleFavorite(apartment: Apartment, event: Event) {
  event.stopPropagation()
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    router.push({ path: '/login', query: { redirect: '/apartments' } })
    return
  }
  try {
    if (apartment.is_favorite) {
      await removeFavorite(apartment.id)
      apartment.is_favorite = false
      showToast('已取消收藏')
    } else {
      await addFavorite(apartment.id)
      apartment.is_favorite = true
      showToast('收藏成功')
    }
  } catch {
    // 错误已在 request 拦截器中 toast
  }
}

// ================= 初始化 =================
onMounted(() => {
  fetchList(true)
})
</script>

<template>
  <div class="apartment-list">
    <!-- 顶部搜索栏 -->
    <div class="sticky top-0 z-10 bg-white shadow-sm">
      <div class="flex items-center px-3 py-2 gap-2">
        <div
          class="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-2"
          @click="showSearch = true"
        >
          <van-icon name="search" class="text-gray-400 mr-2" />
          <span class="text-sm text-gray-400 flex-1">
            {{ keyword || '搜索房源名称' }}
          </span>
          <van-icon v-if="keyword" name="clear" class="text-gray-400" @click.stop="keyword = ''; onRefresh()" />
        </div>
        <div
          class="flex items-center text-sm text-gray-600 px-2 py-1"
          :class="{ 'text-primary font-medium': activeFilterCount > 0 }"
          @click="showFilter = true"
        >
          <van-icon name="filter-o" class="mr-1" />
          筛选
          <van-badge v-if="activeFilterCount > 0" :content="activeFilterCount" class="ml-1" />
        </div>
      </div>
    </div>

    <!-- 列表内容 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div v-if="list.length === 0 && !loading" class="empty-state">
          <van-empty description="暂无房源" />
        </div>

        <div class="px-3 py-2 space-y-3">
          <div
            v-for="item in list"
            :key="item.id"
            class="bg-white rounded-xl overflow-hidden shadow-sm"
            @click="goDetail(item.id)"
          >
            <!-- 封面图 -->
            <div class="relative h-44 bg-gray-100">
              <van-image
                :src="item.cover_image"
                fit="cover"
                class="w-full h-full"
                :alt="item.name"
              />
              <div class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                ¥{{ item.min_monthly_rent || '?' }}/月起
              </div>
              <div v-if="authStore.isTenant" class="absolute top-2 right-2">
                <van-icon
                  :name="item.is_favorite ? 'star' : 'star-o'"
                  :class="item.is_favorite ? 'text-warning' : 'text-white'"
                  class="text-xl drop-shadow"
                  @click.stop="toggleFavorite(item, $event)"
                />
              </div>
            </div>
            <!-- 信息区 -->
            <div class="p-3">
              <h3 class="text-base font-bold text-gray-900 line-clamp-1">{{ item.name }}</h3>
              <p class="text-sm text-gray-500 mt-1 flex items-center">
                <van-icon name="location-o" class="mr-1" />
                {{ item.district_name || '' }} {{ item.street_name || '' }}
              </p>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- 商家悬浮发布按钮 -->
    <van-floating-bubble
      v-if="authStore.isLandlord"
      axis="xy"
      magnetic="x"
      :offset="{ x: 320, y: 500 }"
      @click="goCreate"
    >
      <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
        <van-icon name="plus" class="text-white text-xl" />
      </div>
    </van-floating-bubble>

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top" :style="{ height: '100%' }" class="bg-white">
      <div class="flex items-center px-3 py-2 border-b border-gray-100">
        <van-search
          v-model="keyword"
          placeholder="搜索房源名称"
          show-action
          class="flex-1"
          @search="onSearch"
        >
          <template #action>
            <span class="text-primary text-sm" @click="onSearch">搜索</span>
          </template>
        </van-search>
        <span class="text-sm text-gray-500 ml-2" @click="showSearch = false">取消</span>
      </div>
      <div class="p-4 text-sm text-gray-400">
        输入关键词后点击搜索
      </div>
    </van-popup>

    <!-- 筛选抽屉 -->
    <van-popup v-model:show="showFilter" position="right" :style="{ width: '80%', height: '100%' }" class="bg-white">
      <div class="flex flex-col h-full">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span class="text-base font-bold">筛选条件</span>
          <span v-if="activeFilterCount > 0" class="text-sm text-gray-400" @click="onFilterClear">清空</span>
        </div>

        <!-- 内容区 -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- 行政区 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">行政区</div>
            <div class="flex flex-wrap gap-2">
              <van-tag
                v-for="d in districts"
                :key="d.id"
                :type="filter.district_id === d.id ? 'primary' : 'default'"
                size="large"
                round
                @click="filter.district_id = filter.district_id === d.id ? undefined : d.id"
              >
                {{ d.name }}
              </van-tag>
            </div>
          </div>

          <!-- 街道 -->
          <div v-if="filter.district_id !== undefined || streets.length > 0">
            <div class="text-sm font-bold text-gray-900 mb-2">街道/镇</div>
            <van-loading v-if="streetsLoading" size="20" class="py-2" />
            <div v-else-if="streetsError" class="text-sm text-red-500 py-2">{{ streetsError }}</div>
            <div v-else-if="streets.length === 0" class="text-sm text-gray-400 py-2">暂无街道/镇数据</div>
            <div v-else class="flex flex-wrap gap-2">
              <van-tag
                v-for="s in streets"
                :key="s.id"
                :type="filter.street_id === s.id ? 'primary' : 'default'"
                size="large"
                round
                @click="filter.street_id = filter.street_id === s.id ? undefined : s.id"
              >
                {{ s.name }}
              </van-tag>
            </div>
          </div>

          <!-- 户型 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">户型</div>
            <div class="flex flex-wrap gap-2">
              <van-tag
                v-for="l in layoutTypes"
                :key="l.code"
                :type="filter.layout_type === l.code ? 'primary' : 'default'"
                size="large"
                round
                @click="filter.layout_type = filter.layout_type === l.code ? '' : l.code"
              >
                {{ l.label }}
              </van-tag>
            </div>
          </div>

          <!-- 租期 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">租期</div>
            <div class="flex flex-wrap gap-2">
              <van-tag
                v-for="t in leaseTerms"
                :key="t.code"
                :type="filter.lease_term === t.code ? 'primary' : 'default'"
                size="large"
                round
                @click="filter.lease_term = filter.lease_term === t.code ? '' : t.code"
              >
                {{ t.label }}
              </van-tag>
            </div>
          </div>

          <!-- 价格区间 -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-2">价格区间（元/月）</div>
            <div class="flex items-center gap-2">
              <van-field
                v-model.number="filter.min_price"
                type="digit"
                placeholder="最低"
                class="flex-1"
              />
              <span class="text-gray-400">-</span>
              <van-field
                v-model.number="filter.max_price"
                type="digit"
                placeholder="最高"
                class="flex-1"
              />
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="flex gap-3 p-4 border-t border-gray-100 safe-area-bottom">
          <van-button class="flex-1" @click="onFilterReset">重置</van-button>
          <van-button type="primary" class="flex-1" @click="onFilterConfirm">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="scss">
.apartment-list {
  min-height: 100vh;
  background-color: $bg-color;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  padding-top: 20vh;
}

.text-warning {
  color: $warning;
}

.drop-shadow {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

:deep(.van-search) {
  padding: 0;
}

:deep(.van-field) {
  background-color: #f7f8fa;
  border-radius: 8px;
}

:deep(.van-floating-bubble) {
  --van-floating-bubble-background: transparent;
}
</style>
