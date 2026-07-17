<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { Overlay, Loading } from 'vant'

const uiStore = useUiStore()
</script>

<template>
  <div class="app-wrapper">
    <RouterView />
    <!-- 全局 Loading -->
    <van-overlay :show="uiStore.loading" class="flex items-center justify-center">
      <van-loading :text="uiStore.loadingText" vertical />
    </van-overlay>
  </div>
</template>

<style scoped>
.app-wrapper {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>
