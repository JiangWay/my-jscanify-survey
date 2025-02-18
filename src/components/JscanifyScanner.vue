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

    <!-- 新增進度條 -->
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${validRatioCount * 33.33}%` }"
      ></div>
    </div>

    <!-- 預覽畫布 -->
    <canvas
      ref="previewCanvas"
      class="preview-canvas"
      v-show="!isPaused"
    ></canvas>

    <!-- 新增重新掃描按鈕 -->
    <button v-if="isPaused" @click="restartScanning" class="restart-button">
      重新掃描
    </button>
    <!-- 裁切結果顯示區 -->
    <div v-if="croppedImages" class="cropped-result">
      <h3>裁切結果：</h3>
      <div
        v-for="(image, index) in croppedImages"
        :key="index"
        class="image-container"
      >
        <span class="image-index">{{ croppedImages.length - index }}</span>
        <img :src="image" alt="裁切結果" class="cropped-image" />
      </div>
    </div>

    <div v-if="!isReady" class="loading">正在載入掃描器...</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import cv from "@techstark/opencv-js";
import { useScannerConfig } from "../composables/useScannerConfig";
import { loadScript } from "../utils/cdnLoader";

const {
  CAMERA_CONFIG,
  CANVAS_CONFIG,
  SCANNER_PREVIEW_CONFIG,
  CROP_MARGIN,
  UPDATE_INTERVAL,
  ID_CARD_RATIO,
  JSCANIFY_SCRIPT_URL,
} = useScannerConfig();

const videoElement = ref(null);
const sourceCanvas = ref(null);
const previewCanvas = ref(null);
const isReady = ref(false);
const croppedImages = ref([]);
let scanner = null;

let ratioCheckInterval = null;
const validRatioCount = ref(0);
let animationFrameId = null;
const isPaused = ref(false);

// 新增初始化方法
const initializeScanner = async () => {
  try {
    window.cv = cv;
    if (!window.jscanify) {
      await loadScript(JSCANIFY_SCRIPT_URL, { async: true });
    }
    console.log("window.jscanify", window.jscanify);
    scanner = new window.jscanify();
    isReady.value = true;
    console.log("OpenCV 載入成功");
  } catch (error) {
    console.error("初始化掃描器失敗:", error);
    isReady.value = false;
  }
};

// 新增初始化相機串流函數
const initializeVideoStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONFIG);
    console.log("stream", stream);
    videoElement.value.srcObject = stream;

    return new Promise((resolve) => {
      videoElement.value.onloadedmetadata = () => {
        videoElement.value.play();
        resolve();
      };
    });
  } catch (error) {
    console.error("初始化相機串流失敗：", error);
    throw error;
  }
};

// 新增處理視訊幀函數
const processVideoFrame = (sourceCtx) => {
  sourceCtx.drawImage(
    videoElement.value,
    0,
    0,
    sourceCanvas.value.width,
    sourceCanvas.value.height
  );

  const previewResult = scanner.highlightPaper(
    sourceCanvas.value,
    SCANNER_PREVIEW_CONFIG
  );

  const previewCtx = previewCanvas.value.getContext("2d");
  previewCtx.clearRect(
    0,
    0,
    previewCanvas.value.width,
    previewCanvas.value.height
  );
  previewCtx.drawImage(previewResult, 0, 0);
};

// 新增檢查寬高比的函數
const checkAspectRatio = () => {
  try {
    const img = cv.imread(sourceCanvas.value);
    const contour = scanner.findPaperContour(img);
    if (contour) {
      const corners = scanner.getCornerPoints(contour);
      const width = corners.bottomRightCorner.x - corners.bottomLeftCorner.x;
      const height = corners.topRightCorner.y - corners.bottomRightCorner.y;
      const currentRatio = Math.abs(width / height);
      console.log("ID_CARD_RATIO.MIN", ID_CARD_RATIO.MIN);
      console.log("currentRatio", currentRatio);
      console.log("ID_CARD_RATIO.MAX", ID_CARD_RATIO.MAX);
      console.log("validRatioCount", validRatioCount.value);
      if (
        currentRatio >= ID_CARD_RATIO.MIN &&
        currentRatio <= ID_CARD_RATIO.MAX
      ) {
        validRatioCount.value++;
        if (validRatioCount.value >= 3) {
          cropDocument(corners);
        }
      } else {
        validRatioCount.value = 0;
      }
    }

    img.delete();
  } catch (error) {
    console.error("檢查寬高比失敗：", error);
  }
};

const processVideoFrameLoop = (sourceCtx) => {
  processVideoFrame(sourceCtx);
  animationFrameId = requestAnimationFrame(() =>
    processVideoFrameLoop(sourceCtx)
  );
};

onMounted(async () => {
  try {
    await initializeScanner();
    await initializeVideoStream();

    const sourceCtx = sourceCanvas.value.getContext("2d");

    // 設置畫布尺寸
    sourceCanvas.value.width = CANVAS_CONFIG.width;
    sourceCanvas.value.height = CANVAS_CONFIG.height;
    previewCanvas.value.width = CANVAS_CONFIG.width;
    previewCanvas.value.height = CANVAS_CONFIG.height;

    // 設置視訊幀更新
    processVideoFrameLoop(sourceCtx);

    // 設置寬高比檢查（每 500ms 檢查一次）
    ratioCheckInterval = setInterval(checkAspectRatio, UPDATE_INTERVAL);
  } catch (error) {
    console.error("初始化掃描器失敗：", error);
  }
});

// 裁切文件函數
const cropDocument = (corners) => {
  try {
    // 將識別出來的corners 範圍稍稍加大
    const expandedCorners = {
      bottomLeftCorner: {
        x: corners.bottomLeftCorner.x - CROP_MARGIN,
        y: corners.bottomLeftCorner.y - CROP_MARGIN,
      },
      bottomRightCorner: {
        x: corners.bottomRightCorner.x + CROP_MARGIN,
        y: corners.bottomRightCorner.y + CROP_MARGIN,
      },
      topLeftCorner: {
        x: corners.topLeftCorner.x - CROP_MARGIN,
        y: corners.topLeftCorner.y - CROP_MARGIN,
      },
      topRightCorner: {
        x: corners.topRightCorner.x + CROP_MARGIN,
        y: corners.topRightCorner.y - CROP_MARGIN,
      },
    };
    // 利用座標計算出裁切區域的寬度和高度
    const width =
      expandedCorners.bottomRightCorner.x - expandedCorners.bottomLeftCorner.x;
    const height =
      expandedCorners.topRightCorner.y - expandedCorners.bottomRightCorner.y;
    // 執行裁切
    const extractedPaper = scanner.extractPaper(
      sourceCanvas.value,
      CANVAS_CONFIG.height,
      CANVAS_CONFIG.width,
      expandedCorners
    );

    if (extractedPaper) {
      croppedImages.value.unshift(extractedPaper.toDataURL("image/jpeg"));
      // 停止掃描
      isPaused.value = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (ratioCheckInterval) {
        clearInterval(ratioCheckInterval);
        ratioCheckInterval = null;
      }
    }
  } catch (error) {
    console.error("裁切文件失敗：", error);
  }
};

// 新增重新開始掃描函數
const restartScanning = () => {
  isPaused.value = false;
  validRatioCount.value = 0;
  const sourceCtx = sourceCanvas.value.getContext("2d");

  // 重新開始視訊幀處理
  processVideoFrameLoop(sourceCtx);

  // 重新開始比例檢查
  ratioCheckInterval = setInterval(checkAspectRatio, 500);
};

// 在組件卸載時清理
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (ratioCheckInterval) {
    clearInterval(ratioCheckInterval);
  }
  if (videoElement.value?.srcObject) {
    const tracks = videoElement.value.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
  }
  if (scanner) {
    scanner.dispose && scanner.dispose();
  }
});
</script>

<style scoped>
.scanner-container {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  position: relative;
  background-color: #f8f8f8;
  padding: 20px;
  min-height: 100vh; /* 確保容器至少佔滿螢幕高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.preview-canvas {
  width: 100%;
  height: 100%;
  aspect-ratio: 9 / 16;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 2px solid #ec1010;
}

.cropped-result {
  margin-top: 2rem;
}

.cropped-result h3 {
  color: #666666; /* 設定為灰色 */
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

.image-container {
  position: relative;
  margin-bottom: 1rem;
}

.image-index {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin: 8px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease-out;
}

.restart-button {
  display: block;
  margin: 1rem auto;
  padding: 0.8rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.restart-button:hover {
  background-color: #45a049;
}

/* 新增 RWD 相關樣式 */
@media screen and (max-width: 768px) {
  .scanner-container {
    padding: 10px;
    max-width: 100%;
  }

  .preview-canvas {
    width: 100%;
    max-height: 80vh; /* 避免在手機上太高 */
  }

  .restart-button {
    width: 100%;
    max-width: 300px;
    padding: 12px;
    font-size: 16px; /* 在手機上增加按鈕大小，更容易點擊 */
  }

  .cropped-image {
    margin-bottom: 0.5rem;
  }
}
</style>
