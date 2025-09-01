'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { Copy, Share, ArrowUpDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { NAME_TOKEN } from '@/lib/utils'
import { useWalletStore } from '@/stores/wallet-store'
import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

interface WalletReceiveProps {
  onNavigate: (view: string) => void
}

export function WalletReceive({ onNavigate }: WalletReceiveProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [requestAmount, setRequestAmount] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const wallet = useWalletStore((state) => state.wallet)
  const coinPrice = useWalletStore((state) => state.coinPrice)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 自动生成二维码
  useEffect(() => {
    if (wallet.address) {
      const qrText = requestAmount ? `${wallet.address}?amount=${requestAmount}` : wallet.address
      generateQRCode(qrText)
    }
  }, [wallet.address, requestAmount])

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address)
    toast({
      title: t('receive.addressCopied'),
      description: t('receive.addressCopiedDesc'),
      variant: 'success'
    })
  }

  const shareAddress = () => {
    if (navigator.share) {
      navigator.share({
        title: 'SCASH Wallet Address',
        text: `Send ${NAME_TOKEN} to: ${wallet.address}`
      })
    } else {
      copyAddress()
    }
  }

  const generateQRCode = async (text: string) => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      // 生成二维码到canvas
      await QRCode.toCanvas(canvas, text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // 转换为数据URL
      const dataUrl = canvas.toDataURL()
      setQrCodeUrl(dataUrl)
    } catch (error) {
      console.error('生成二维码失败:', error)
      toast({
        title: t('common.error'),
        description: t('common.errorDesc'),
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {t('common.youHave')} {wallet.balance} {NAME_TOKEN}
          </span>
          <div className="text-right">
            <div className="text-white font-medium">1 {NAME_TOKEN}</div>
            <div className="text-gray-400">${coinPrice} USD</div>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <Card className="bg-white border-gray-700">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-48 h-48 bg-white rounded-lg flex items-center justify-center">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-full h-full rounded-lg" />
              ) : (
                <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500">生成中...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 隐藏的canvas用于生成二维码 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} width={200} height={200} />

      {/* Wallet Address */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="px-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">{t('receive.address')}</Label>
            </div>

            <div className="p-3 bg-gray-900 rounded-lg">
              <p className="text-white font-mono text-sm break-all">{wallet.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={copyAddress} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">
          <Copy className="h-4 w-4 mr-2" />
          FIO Request
        </Button>

        <Button onClick={copyAddress} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
          <Copy className="h-4 w-4 mr-2" />
          {t('common.copy')}
        </Button>

        <Button onClick={shareAddress} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">
          <Share className="h-4 w-4 mr-2" />
          {t('common.share')}
        </Button>
      </div>
    </div>
  )
}
