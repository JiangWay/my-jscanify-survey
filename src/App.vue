<script setup>
import JscanifyScanner from './components/JscanifyScanner.vue'

const handleScan = (code) => {
  console.log('掃描到的代碼：', code)
}
</script>

<template>
  <div class="app">
    <h1>掃描器示例</h1>
    <JscanifyScanner @scan="handleScan" />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
