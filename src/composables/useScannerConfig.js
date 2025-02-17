// 相機設定
export const CAMERA_CONFIG = {
  video: {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    aspectRatio: { ideal: 4 / 3 },
    focusMode: "continuous",
    exposureMode: "continuous",
  },
};

// Canvas 設定
export const CANVAS_CONFIG = {
  width: 480,
  height: 640,
};

// 掃描器預覽設定
export const SCANNER_PREVIEW_CONFIG = {
  color: "orange",
  thickness: 3,
};

// 裁切邊距設定
export const CROP_MARGIN = 10;

// 更新間隔（毫秒）
export const UPDATE_INTERVAL = 100;

// 如果需要在未來擴充更多功能，可以包裝成一個 composable
export const useScannerConfig = () => {
  return {
    CAMERA_CONFIG,
    CANVAS_CONFIG,
    SCANNER_PREVIEW_CONFIG,
    CROP_MARGIN,
    UPDATE_INTERVAL,
  };
};
