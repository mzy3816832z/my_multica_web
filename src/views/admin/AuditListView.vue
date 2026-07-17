<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  showToast,
  showConfirmDialog,
  Tabs,
  Tab,
  PullRefresh,
  List,
  Empty,
  Loading,
  Image as VanImage,
  Tag,
  Button,
  Icon,
  NavBar,
  Cell,
  Badge,
  Search,
} from 'vant'
import { getAdminAudits, approveAudit, rejectAudit } from '@/api/admin'
import { useUiStore } from '@/stores/ui'
import type { AuditRecord } from '@/types'

const router = useRouter()
const uiStore = useUiStore()

const activeTab = ref(0)
const tabNames = ['全部', '提交审核', '变更审核']
const tabTypes: (undefined | 'first_review' | 'change_review')[] = [undefined, 'first_review', 'change_review']

const list = ref<AuditRecord[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const PAGE_SIZE = 10

const keyword = ref('')

// 加载列表
async function loadList(isRefresh = false) {
  if (isRefresh) {
    page.value = 1
    finished.value = false
  }
  if (finished.value) return

  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: PAGE_SIZE,
      type: tabTypes[activeTab.value],
    }
    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }
    const res = await getAdminAudits(params)
    const data = res as unknown as { items: AuditRecord[]; total: number; page: number; page_size: number }
    if (isRefresh) {
      list.value = data.items
    } else {
      list.value.push(...data.items)
    }
    page.value++
    if (list.value.length >= data.total) {
      finished.value = true
    }
  } catch {
    // 错误已在 request 拦截器中 toast
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  loadList(true)
}

function onLoad() {
  loadList()
}

function onTabChange() {
  loadList(true)
}

function onSearch() {
  loadList(true)
}

function goDetail(id: number) {
  router.push('/admin/audits/' + id)
}

// 快捷通过
async function onQuickApprove(id: number) {
  try {
    await showConfirmDialog({
      title: '确认通过',
      message: '审核通过后，房源将正式上架或变更生效，确定继续吗？',
    })
    uiStore.showLoading('处理中...')
    await approveAudit(id)
    showToast('已通过')
    loadList(true)
  } catch (err: any) {
    if (err?.message === 'cancel') {
      // 用户取消
    }
  } finally {
    uiStore.hideLoading()
  }
}

// 快捷驳回
async function onQuickReject(id: number) {
  try {
    await showConfirmDialog({
      title: '确认驳回',
      message: '驳回后该房源将退回商家修改，确定继续吗？',
    })
    uiStore.showLoading('处理中...')
    await rejectAudit(id, '不符合平台规范')
    showToast('已驳回')
    loadList(true)
  } catch (err: any) {
    if (err?.message === 'cancel') {
      // 用户取消
    }
  } finally {
    uiStore.hideLoading()
  }
}

function auditTypeText(type?: string) {
  return type === 'first_review' ? '提交审核' : '变更审核'
}

function auditStatusText(status?: string) {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  }
  return map[status || ''] || status || '-'
}

function auditStatusType(status?: string): 'primary' | 'success' | 'warning' | 'danger' | 'default' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status || ''] || 'default'
}

onMounted(() => {
  loadList(true)
})
</script>

<template>
  <div class="audit-list-page">
    <van-nav-bar title="审核管理" fixed placeholder />

    <!-- 搜索栏 -->
    <div class="sticky top-[46px] z-10 bg-bg">
      <van-search
        v-model="keyword"
        placeholder="搜索房源名称"
        shape="round"
        @search="onSearch"
        @clear="onSearch"
        class="px-4 py-2"
      />
    </div>

    <van-tabs v-model:active="activeTab" sticky offset-top="100" class="audit-tabs" @change="onTabChange">
      <van-tab v-for="(name, idx) in tabNames" :key="idx" :title="name">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <!-- 空状态 -->
            <van-empty v-if="list.length === 0 && !loading" description="暂无审核记录" />

            <!-- 审核卡片列表 -->
            <div v-else class="p-3 space-y-3">
              <div
                v-for="item in list"
                :key="item.id"
                class="bg-white rounded-xl overflow-hidden shadow-sm"
                @click="goDetail(item.id)"
              >
                <div class="flex p-3 gap-3">
                  <van-image
                    :src="(item.submitted_data as any)?.cover_image || ''"
                    fit="cover"
                    class="w-24 h-24 rounded-lg flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div class="text-sm font-bold text-gray-900 truncate">
                        {{ (item.submitted_data as any)?.name || '-' }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        {{ auditTypeText(item.type) }}
                      </div>
                      <div v-if="item.changed_fields && item.changed_fields.length > 0" class="text-xs text-danger mt-0.5">
                        变更字段：{{ item.changed_fields.join('、') }}
                      </div>
                      <div class="text-xs text-gray-400 mt-0.5">
                        提交时间：{{ item.created_at }}
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                      <van-tag :type="auditStatusType(item.status)" size="medium" round>
                        {{ auditStatusText(item.status) }}
                      </van-tag>
                      <span v-if="item.status === 'pending'" class="text-xs text-gray-400">待处理</span>
                    </div>
                  </div>
                </div>

                <!-- 快捷操作（仅待审核） -->
                <div v-if="item.status === 'pending'" class="flex border-t border-gray-100">
                  <div
                    class="flex-1 py-2.5 text-center text-sm text-success flex items-center justify-center gap-1"
                    @click.stop="onQuickApprove(item.id)"
                  >
                    <van-icon name="success" />
                    <span>通过</span>
                  </div>
                  <div class="w-px bg-gray-100" />
                  <div
                    class="flex-1 py-2.5 text-center text-sm text-danger flex items-center justify-center gap-1"
                    @click.stop="onQuickReject(item.id)"
                  >
                    <van-icon name="close" />
                    <span>驳回</span>
                  </div>
                </div>
              </div>
            </div>
          </van-list>
        </van-pull-refresh>
      </van-tab>
    </van-tabs>
  </div>
</template>

<style scoped lang="scss">
.audit-list-page {
  min-height: 100vh;
  background-color: $bg-color;
}

.text-danger {
  color: $danger;
}

.text-success {
  color: $success;
}

.text-primary {
  color: $primary;
}

.audit-tabs {
  :deep(.van-tabs__wrap) {
    background-color: #fff;
  }
}
</style>
