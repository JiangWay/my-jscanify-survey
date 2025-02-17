<template>
  <div class="scanner-container">
    <video
      ref="videoElement"
      style="display: none"
      autoplay
      playsinline
      muted
    ></video>
    <canvas ref="sourceCanvas" style="display: none"></canvas>
    <canvas ref="resultCanvas" class="result-canvas"></canvas>
    <div v-if="!isReady" class="loading">正在載入掃描器...</div>
    <div v-if="result" class="result">
      {{ result }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import jscanify from "jscanify/src/jscanify";
import cv from "@techstark/opencv-js";

const videoElement = ref(null);
const sourceCanvas = ref(null);
const resultCanvas = ref(null);
const isReady = ref(true);
let scanner = null;
const result = ref(null);

onMounted(async () => {
  try {
    window.cv = cv;
    scanner = new jscanify();
    console.log("OpenCV 載入成功");
    const canvasCtx = sourceCanvas.value.getContext("2d");
    const resultCtx = resultCanvas.value.getContext("2d");
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoElement.value.srcObject = stream;
      videoElement.value.onloadedmetadata = () => {
        videoElement.value.play();

        setInterval(() => {
          canvasCtx.drawImage(videoElement.value, 0, 0);
          const resultCanvas = scanner.highlightPaper(sourceCanvas.value);
          resultCtx.drawImage(resultCanvas, 0, 0);
        }, 10);
      };
    });
  } catch (error) {
    console.error("初始化掃描器失敗：", error);
  }
});

// 在組件卸載時清理
onUnmounted(() => {});
</script>

<style scoped>
.scanner-container {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  background-color: #f8f8f8; /* 添加淺色背景以提高紙張檢測效果 */
  padding: 20px;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 1rem;
  border-radius: 4px;
}

.result-canvas {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.result {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>
