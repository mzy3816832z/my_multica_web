<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { getDicts } from '@/api/dict'
import type { DictItem } from '@/types'

interface Props {
  category: string
  modelValue?: string | string[]
  multiple?: boolean
  placeholder?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  multiple: false,
  placeholder: '请选择',
  title: '请选择',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const items = ref<DictItem[]>([])
const loading = ref(false)
const error = ref('')
const showPicker = ref(false)

const selectedLabel = ref('')

function findLabel(code: string) {
  return items.value.find(i => i.code === code)?.label || code
}

function updateLabel() {
  if (props.multiple) {
    const codes = (props.modelValue as string[]) || []
    selectedLabel.value = codes.length > 0
      ? codes.map(c => findLabel(c)).join('、')
      : ''
  } else {
    const code = props.modelValue as string
    selectedLabel.value = code ? findLabel(code) : ''
  }
}

async function loadDicts() {
  loading.value = true
  error.value = ''
  try {
    const res = await getDicts(props.category)
    items.value = res as unknown as DictItem[]
    updateLabel()
  } catch {
    error.value = '加载选项失败'
  } finally {
    loading.value = false
  }
}

watch(() => props.category, () => {
  loadDicts()
})

watch(() => props.modelValue, () => {
  updateLabel()
}, { deep: true })

onMounted(() => {
  loadDicts()
})

function onConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  const selected = selectedOptions[0]
  if (selected) {
    emit('update:modelValue', selected.value)
  }
  showPicker.value = false
}

function onMultiConfirm() {
  showPicker.value = false
}

const tempSelected = ref<string[]>([])

function openMultiPicker() {
  tempSelected.value = ((props.modelValue as string[]) || []).slice()
  showPicker.value = true
}

function toggleItem(code: string) {
  const idx = tempSelected.value.indexOf(code)
  if (idx >= 0) {
    tempSelected.value.splice(idx, 1)
  } else {
    tempSelected.value.push(code)
  }
}

function isSelected(code: string) {
  return tempSelected.value.includes(code)
}

function confirmMulti() {
  emit('update:modelValue', tempSelected.value.slice())
  showPicker.value = false
}

const columns = computed(() =>
  items.value.map(i => ({ text: i.label, value: i.code }))
)
</script>

<template>
  <div class="dict-select">
    <van-field
      v-model="selectedLabel"
      readonly
      clickable
      :placeholder="loading ? '加载中...' : placeholder"
      :border="false"
      class="bg-gray-50 rounded-lg"
      @click="loading || items.length === 0 ? undefined : (multiple ? openMultiPicker() : (showPicker = true))"
    >
      <template #right-icon>
        <van-loading v-if="loading" size="16" />
      </template>
    </van-field>

    <div v-if="error" class="text-xs text-danger mt-1 px-3">
      {{ error }}
      <span class="text-primary ml-2" @click="loadDicts">重试</span>
    </div>
    <div v-else-if="!loading && items.length === 0" class="text-xs text-gray-400 mt-1 px-3">
      暂无选项数据
    </div>

    <template v-if="multiple">
      <van-popup v-model:show="showPicker" position="bottom" round :style="{ maxHeight: '60%' }">
        <div class="multi-select-popup">
          <div class="multi-select-header">
            <span @click="showPicker = false">取消</span>
            <span class="multi-select-title">{{ title }}</span>
            <span class="multi-select-confirm" @click="confirmMulti">确定</span>
          </div>
          <div class="multi-select-body">
            <div
              v-for="item in items"
              :key="item.code"
              class="multi-select-item"
              @click="toggleItem(item.code)"
            >
              <span class="text-sm text-gray-900">{{ item.label }}</span>
              <van-icon
                :name="isSelected(item.code) ? 'success' : ''"
                :class="isSelected(item.code) ? 'text-primary' : 'text-gray-300'"
              />
            </div>
            <div v-if="items.length === 0 && !loading" class="text-sm text-gray-400 text-center py-8">
              暂无选项数据
            </div>
          </div>
        </div>
      </van-popup>
    </template>

    <template v-else>
      <van-popup v-model:show="showPicker" position="bottom" round>
        <van-picker
          :columns="columns"
          :title="title"
          @confirm="onConfirm"
          @cancel="showPicker = false"
        />
      </van-popup>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dict-select {
  :deep(.van-field) {
    background-color: #f7f8fa;
    border-radius: 8px;
    padding: 8px 12px;
  }
}

.text-danger {
  color: $danger;
}

.text-primary {
  color: $primary;
}

.multi-select-popup {
  display: flex;
  flex-direction: column;
  max-height: 60vh;
}

.multi-select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebedf0;
  font-size: 14px;
  color: $text-color;
}

.multi-select-title {
  font-weight: bold;
}

.multi-select-confirm {
  color: $primary;
}

.multi-select-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.multi-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;

  &:active {
    background-color: #f7f8fa;
  }
}
</style>
