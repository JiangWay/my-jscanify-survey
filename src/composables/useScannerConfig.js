// 相機設定
export const CAMERA_CONFIG = {
  video: {
    facingMode: "environment",
    width: 1920,
    height: 1080,
    focusMode: "continuous",
    exposureMode: "continuous",
  },
};

// Canvas 設定
export const CANVAS_CONFIG = {
  width: 720,
  height: 1280,
};

// 掃描器預覽設定
export const SCANNER_PREVIEW_CONFIG = {
  color: "orange",
  thickness: 3,
};

// 裁切邊距設定
export const CROP_MARGIN = 10;

// 更新間隔（毫秒）
export const UPDATE_INTERVAL = 500;

// 寬高比容許誤差 (%)
export const ASPECT_RATIO_TOLERANCE = 10;

// https://www.ris.gov.tw/app/portal/189
export const ID_CARD_RATIO = {
  MIN: (85.7 / 54) * (1 - ASPECT_RATIO_TOLERANCE / 100), // 身分證護貝
  MAX: (79.7 / 48) * (1 + ASPECT_RATIO_TOLERANCE / 100), // 身分證紙卡
};

export const JSCANIFY_SCRIPT_URL =
  "https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js";

// 如果需要在未來擴充更多功能，可以包裝成一個 composable
export const useScannerConfig = () => {
  return {
    CAMERA_CONFIG,
    CANVAS_CONFIG,
    SCANNER_PREVIEW_CONFIG,
    CROP_MARGIN,
    UPDATE_INTERVAL,
    ID_CARD_RATIO,
    ASPECT_RATIO_TOLERANCE,
    JSCANIFY_SCRIPT_URL,
  };
};
