<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
  if (props.multiple) {
    const codes = selectedOptions.map(o => o.value)
    emit('update:modelValue', codes)
  } else {
    const selected = selectedOptions[0]
    if (selected) {
      emit('update:modelValue', selected.value)
    }
  }
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
      @click="showPicker = true"
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

    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-picker
        :columns="columns"
        :title="title"
        @confirm="onConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
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
</style>
