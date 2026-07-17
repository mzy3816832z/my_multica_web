<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="p-4">
    <h1 class="text-lg font-bold mb-4">登录</h1>
    <p class="text-sm text-gray-500">登录页面占位，后续 Issue 实现完整表单。</p>
    <van-button type="primary" class="mt-4" block @click="router.push('/apartments')">
      去房源列表
    </van-button>
  </div>
</template>
