// utils/cdnLoader.js
export const loadScript = (url, attributes = {}) => {
  return new Promise((resolve, reject) => {
    // 檢查是否已經載入
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve(existingScript);
      return;
    }

    const script = document.createElement("script");
    script.src = url;

    // 設置額外的屬性
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    script.onload = () => resolve(script);
    script.onerror = (error) => reject(new Error(`載入 CDN 失敗: ${url}`));

    document.head.appendChild(script);
  });
};

export const loadStyle = (url) => {
  return new Promise((resolve, reject) => {
    // 檢查是否已經載入
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) {
      resolve(existingLink);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;

    link.onload = () => resolve(link);
    link.onerror = (error) => reject(new Error(`載入 CSS 失敗: ${url}`));

    document.head.appendChild(link);
  });
};
