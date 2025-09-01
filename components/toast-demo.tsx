'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ToastDemo() {
  const { toast } = useToast()

  const showDefaultToast = () => {
    toast({
      title: "默认通知",
      description: "这是一个默认样式的通知消息，会在3秒后自动关闭。",
    })
  }

  const showSuccessToast = () => {
    toast({
      variant: "success",
      title: "操作成功",
      description: "您的操作已成功完成！",
    })
  }

  const showWarningToast = () => {
    toast({
      variant: "warning",
      title: "警告提示",
      description: "请注意，这是一个警告消息。",
    })
  }

  const showErrorToast = () => {
    toast({
      variant: "destructive",
      title: "错误提示",
      description: "操作失败，请重试。",
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Toast 通知组件演示</CardTitle>
          <CardDescription className="text-gray-400">
            点击下面的按钮来测试不同类型的通知效果
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={showDefaultToast}
              className="bg-purple-600 hover:bg-purple-700"
            >
              默认通知
            </Button>
            <Button 
              onClick={showSuccessToast}
              className="bg-green-600 hover:bg-green-700"
            >
              成功通知
            </Button>
            <Button 
              onClick={showWarningToast}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              警告通知
            </Button>
            <Button 
              onClick={showErrorToast}
              className="bg-red-600 hover:bg-red-700"
            >
              错误通知
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-white font-semibold mb-2">功能特性：</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• 只显示一个通知（新通知会替换旧通知）</li>
              <li>• 3秒自动关闭</li>
              <li>• 可手动点击关闭按钮</li>
              <li>• 美观的渐变背景和动画效果</li>
              <li>• 支持多种通知类型（默认、成功、警告、错误）</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}