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

    <!-- 預覽畫布 -->
    <canvas ref="previewCanvas" class="preview-canvas"></canvas>

    <!-- 裁切按鈕 -->
    <button @click="cropDocument" class="crop-button">確認裁切</button>

    <!-- 裁切結果顯示區 -->
    <div v-if="croppedImage" class="cropped-result">
      <h3>裁切結果：</h3>
      <div v-for="(image, index) in croppedImage" :key="index">
        <img :src="image" alt="裁切結果" class="cropped-image" />
      </div>
    </div>

    <div v-if="!isReady" class="loading">正在載入掃描器...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import jscanify from "jscanify/src/jscanify";
import cv from "@techstark/opencv-js";

const videoElement = ref(null);
const sourceCanvas = ref(null);
const previewCanvas = ref(null);
const isReady = ref(false);
const croppedImage = ref([]);
let scanner = null;
let streamInterval = null;

onMounted(async () => {
  try {
    window.cv = cv;
    scanner = new jscanify();
    isReady.value = true;
    console.log("OpenCV 載入成功");

    const sourceCtx = sourceCanvas.value.getContext("2d");

    // 設定 canvas 尺寸
    sourceCanvas.value.width = 480;
    sourceCanvas.value.height = 640;
    previewCanvas.value.width = 480;
    previewCanvas.value.height = 640;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 4 / 3 },
          focusMode: "continuous", // 自動持續對焦
          exposureMode: "continuous", // 自動持續曝光
        },
      })
      .then((stream) => {
        videoElement.value.srcObject = stream;
        videoElement.value.onloadedmetadata = () => {
          videoElement.value.play();

          streamInterval = setInterval(() => {
            // 繪製視訊畫面到來源 canvas
            sourceCtx.drawImage(
              videoElement.value,
              0,
              0,
              sourceCanvas.value.width,
              sourceCanvas.value.height
            );

            // 使用 highlightPaper 進行預覽
            const previewResult = scanner.highlightPaper(sourceCanvas.value, {
              color: "orange",
              thickness: 3,
            });

            // 將預覽結果顯示在預覽畫布上
            const previewCtx = previewCanvas.value.getContext("2d");
            previewCtx.clearRect(
              0,
              0,
              previewCanvas.value.width,
              previewCanvas.value.height
            );
            previewCtx.drawImage(previewResult, 0, 0);
          }, 100);
        };
      });
  } catch (error) {
    console.error("初始化掃描器失敗：", error);
  }
});

// 裁切文件函數
const cropDocument = () => {
  try {
    const img = cv.imread(sourceCanvas.value);
    const contour = scanner.findPaperContour(img);

    if (contour) {
      const corners = scanner.getCornerPoints(contour);
      console.log("corners", corners);
      // 將識別出來的corners 範圍稍稍加大
      const expandedCorners = {
        bottomLeftCorner: {
          x: corners.bottomLeftCorner.x - 10,
          y: corners.bottomLeftCorner.y - 10,
        },
        bottomRightCorner: {
          x: corners.bottomRightCorner.x + 10,
          y: corners.bottomRightCorner.y + 10,
        },
        topLeftCorner: {
          x: corners.topLeftCorner.x - 10,
          y: corners.topLeftCorner.y - 10,
        },
        topRightCorner: {
          x: corners.topRightCorner.x + 10,
          y: corners.topRightCorner.y - 10,
        },
      };
      // 利用座標計算出裁切區域的寬度和高度
      const width =
        expandedCorners.bottomRightCorner.x -
        expandedCorners.bottomLeftCorner.x;
      const height =
        expandedCorners.topRightCorner.y - expandedCorners.bottomRightCorner.y;
      console.log(width, height);
      // 執行裁切
      const extractedPaper = scanner.extractPaper(
        sourceCanvas.value,
        640,
        480,
        expandedCorners
      );

      if (extractedPaper) {
        // 將裁切結果轉換為 base64 圖片
        croppedImage.value.push(extractedPaper.toDataURL("image/jpeg"));
      }
    }

    img.delete();
  } catch (error) {
    console.error("裁切文件失敗：", error);
  }
};

// 在組件卸載時清理
onUnmounted(() => {
  if (streamInterval) {
    clearInterval(streamInterval);
  }
  if (videoElement.value?.srcObject) {
    videoElement.value.srcObject.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
.scanner-container {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  position: relative;
  background-color: #f8f8f8;
  padding: 20px;
}

.preview-canvas {
  width: 100%;
  height: 100%;
  aspect-ratio: 3/4; /* 保持 4:3 的寬高比 */
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 2px solid #ec1010;
}

.crop-button {
  display: block;
  width: 100%;
  padding: 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin: 1rem 0;
}

.crop-button:hover {
  background-color: #45a049;
}

.cropped-result {
  margin-top: 2rem;
}

.cropped-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
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
</style>
