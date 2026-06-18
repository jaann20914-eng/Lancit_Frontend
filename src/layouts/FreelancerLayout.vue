<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from '@/widgets/sidebar/AppSidebar.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-main {
  margin-left: 220px;
  flex: 1;
  background-color: #f4f5f7;
  min-height: 100vh;
}
</style>