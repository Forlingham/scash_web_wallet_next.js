import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type Language = 'en' | 'zh' | 'ru'

// 检测浏览器语言
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language.toLowerCase()
  
  // 支持的语言映射
  if (browserLang.startsWith('zh')) {
    return 'zh'
  } else if (browserLang.startsWith('ru')) {
    return 'ru'
  } else {
    return 'en' // 默认英文
  }
}

interface LanguageState {
  language: Language
  hasManuallySet: boolean // 标记用户是否手动设置过语言
  setLanguage: (language: Language) => void
}

// 创建语言状态store
export const useLanguageStore = create<LanguageState>()((
  persist(
    immer((set) => ({
      language: detectBrowserLanguage() as Language, // 初始化时检测浏览器语言
      hasManuallySet: false, // 初始状态为未手动设置
      setLanguage: (language: Language) => set((state) => {
        state.language = language
        state.hasManuallySet = true // 用户手动设置后标记为已手动设置
      })
    })),
    {
      name: 'language-storage', // localStorage中的key名称
      partialize: (state) => ({ 
        language: state.language, 
        hasManuallySet: state.hasManuallySet 
      }), // 只持久化language和hasManuallySet字段
    }
  )
))

// 获取当前语言（自动检测或用户设置）
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  
  const stored = useLanguageStore.getState()
  
  // 如果用户手动设置过，使用用户设置的语言
  if (stored.hasManuallySet) {
    return stored.language
  }
  
  // 否则使用浏览器语言
  return detectBrowserLanguage()
}

// 便捷的hooks
export const useLanguage = () => useLanguageStore((state) => state.language)
export const useSetLanguage = () => useLanguageStore((state) => state.setLanguage)