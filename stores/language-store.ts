import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type Language = 'en' | 'zh' | 'ru'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

// 创建语言状态store
export const useLanguageStore = create<LanguageState>()((
  persist(
    immer((set) => ({
      language: 'en' as Language,
      setLanguage: (language: Language) => set((state) => {
        state.language = language
      })
    })),
    {
      name: 'language-storage', // localStorage中的key名称
      partialize: (state) => ({ language: state.language }), // 只持久化language字段
    }
  )
))

// 便捷的hooks
export const useLanguage = () => useLanguageStore((state) => state.language)
export const useSetLanguage = () => useLanguageStore((state) => state.setLanguage)