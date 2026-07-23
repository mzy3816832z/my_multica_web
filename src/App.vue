<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const uiStore = useUiStore()
const authStore = useAuthStore()

const showTabBar = computed(() => {
  return authStore.isLoggedIn && !!authStore.role && !route.meta.hideTabBar
})

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/profile')) return 'profile'
  return 'apartments'
})
</script>

<template>
  <div class="app-wrapper" :class="{ 'has-tabbar': showTabBar }">
    <RouterView />
    <!-- 底部 TabBar -->
    <van-tabbar
      v-if="showTabBar"
      v-model="activeTab"
      :safe-area-inset-bottom="true"
      route
      fixed
      placeholder
    >
      <van-tabbar-item icon="home-o" to="/apartments">房源</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
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
