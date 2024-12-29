declare const _default: import("vite").UserConfig;
export default _default;


// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_BOOKS_API_KEY: string;
    // Add more environment variables as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
