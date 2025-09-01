"use client"

import { useState } from "react"
import { useLanguage, useSetLanguage, type Language } from "@/stores/language-store"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Globe } from "lucide-react"

const languageNames = {
  en: "English",
  zh: "中文",
  ru: "Русский",
}

export function LanguageSelector() {
  const language = useLanguage()
  const setLanguage = useSetLanguage()
  const [open, setOpen] = useState(false)

  const handleLanguageSelect = (code: Language) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
          <Globe className="h-4 w-4 mr-2" />
          {languageNames[language]}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="bg-gray-800 border-gray-700 w-[120px] p-1">
        <div className="space-y-1">
          {Object.entries(languageNames).map(([code, name]) => (
            <button
              key={code}
              onClick={() => handleLanguageSelect(code as Language)}
              className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-sm cursor-pointer transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
