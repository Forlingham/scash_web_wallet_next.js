'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import QrScanner from 'qr-scanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Camera, CameraOff, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanResult: (result: string) => void
}

export function QRScannerComponent({ isOpen, onClose, onScanResult }: QRScannerProps) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 添加状态ref来获取最新状态值
  const isScanningRef = useRef(false)
  const isVideoReadyRef = useRef(false)

  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [hasCamera, setHasCamera] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)

  // 同步状态到ref
  useEffect(() => {
    isScanningRef.current = isScanning
  }, [isScanning])

  useEffect(() => {
    isVideoReadyRef.current = isVideoReady
  }, [isVideoReady])
  const checkCameraAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')
      return videoDevices.length > 0
    } catch (err) {
      console.error('检查摄像头可用性失败:', err)
      return false
    }
  }, [])

  // 启动摄像头
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return false

    try {
      setIsInitializing(true)
      setError('')
      setIsVideoReady(false)

      // 检查摄像头可用性
      const cameraAvailable = await checkCameraAvailability()
      if (!cameraAvailable) {
        setError(t('qr.error'))
        setHasCamera(false)
        return false
      }

      // 如果已有流在运行，先停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // 如果视频正在播放，先停止
      const video = videoRef.current
      if (!video.paused) {
        video.pause()
        // 等待暂停完成
        await new Promise<void>((resolve) => {
          if (video.paused) {
            resolve()
          } else {
            const onPause = () => {
              video.removeEventListener('pause', onPause)
              resolve()
            }
            video.addEventListener('pause', onPause)
          }
        })
      }

      // 清理之前的srcObject
      if (video.srcObject) {
        video.srcObject = null
        // 等待srcObject清理完成
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // 获取摄像头流
      const constraints = {
        video: {
          facingMode: 'environment', // 优先使用后置摄像头
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // 检查组件是否仍然挂载
      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return false
      }

      streamRef.current = stream

      // 设置video元素
      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      video.setAttribute('muted', 'true')

      // 等待视频加载并播放
      await new Promise<void>((resolve, reject) => {
        let resolved = false
        let timeoutId: NodeJS.Timeout

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('canplay', onCanPlay)
          video.removeEventListener('error', onError)
          video.removeEventListener('abort', onAbort)
        }

        const resolveOnce = (success: boolean, error?: Error) => {
          if (resolved) return
          resolved = true
          cleanup()
          if (success) {
            setIsVideoReady(true)
            resolve()
          } else {
            reject(error || new Error('Video loading failed'))
          }
        }

        const onLoadedMetadata = async () => {
          try {
            if (video.readyState >= 2) {
              await video.play()
              resolveOnce(true)
            }
          } catch (playError) {
            console.error('视频播放失败:', playError)
            resolveOnce(false, playError as Error)
          }
        }

        const onCanPlay = async () => {
          try {
            await video.play()
            resolveOnce(true)
          } catch (playError) {
            console.error('视频播放失败:', playError)
            resolveOnce(false, playError as Error)
          }
        }

        const onError = () => {
          resolveOnce(false, new Error('Video loading failed'))
        }

        const onAbort = () => {
          resolveOnce(false, new Error('Video loading was aborted'))
        }

        // 设置超时
        timeoutId = setTimeout(() => {
          resolveOnce(false, new Error('Video loading timeout'))
        }, 10000) // 10秒超时

        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('canplay', onCanPlay)
        video.addEventListener('error', onError)
        video.addEventListener('abort', onAbort)

        // 如果视频已经准备好
        if (video.readyState >= 2) {
          onLoadedMetadata()
        } else if (video.readyState >= 1) {
          onCanPlay()
        }
      })

      setHasCamera(true)
      return true
    } catch (err) {
      console.error('启动摄像头失败:', err)
      const errorMessage = err instanceof Error ? err.message : '未知错误'

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError(t('qr.errorDesc'))
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        setError(t('qr.error'))
        setHasCamera(false)
      } else {
        setError(`摄像头启动失败: ${errorMessage}`)
      }

      return false
    } finally {
      setIsInitializing(false)
    }
  }, [checkCameraAvailability])

  // 停止摄像头
  const stopCamera = useCallback(() => {
    // 停止扫描
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // 停止视频流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    // 清理video元素
    if (videoRef.current) {
      const video = videoRef.current
      if (!video.paused) {
        video.pause()
      }
      video.srcObject = null
    }

    setIsScanning(false)
    setIsVideoReady(false)
  }, [])

  // 扫描二维码
  const scanQRCode = useCallback(async () => {
    // 使用ref获取最新状态，避免闭包问题
    const currentIsScanning = isScanningRef.current
    const currentIsVideoReady = isVideoReadyRef.current

    if (!videoRef.current || !canvasRef.current || !currentIsScanning || !currentIsVideoReady) {
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return
      }

      // 设置canvas尺寸
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 绘制当前帧到canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 获取图像数据进行验证
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 使用QrScanner解析canvas中的二维码
      try {
        // @ts-ignore
        const result = await QrScanner.scanImage(canvas, {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false
        })

        if (result && result.data) {
          onScanResult(result.data)
          // 直接调用onClose而不是handleClose
          onClose()
        }
      } catch (scanErr) {
        // 没有找到二维码，继续扫描
      }
    } catch (err) {
      console.error('扫描二维码失败:', err)
    }
  }, [onScanResult])

  // 开始扫描
  const startScanning = useCallback(async () => {
    // 如果已经在扫描，直接返回
    if (isScanning || isInitializing) {
      return
    }

    const cameraStarted = await startCamera()

    if (!cameraStarted) {
      return
    }

    setIsScanning(true)

    // 开始定期扫描
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 300) // 每300ms扫描一次
  }, [startCamera, scanQRCode, isScanning, isInitializing])

  // 停止扫描
  const stopScanning = useCallback(() => {
    stopCamera()
  }, [stopCamera])

  // 切换扫描状态
  const toggleScanning = useCallback(async () => {
    if (isScanning) {
      // 停止扫描
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      // 停止视频流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        streamRef.current = null
      }

      // 清理video元素
      if (videoRef.current) {
        const video = videoRef.current
        if (!video.paused) {
          video.pause()
        }
        video.srcObject = null
      }

      setIsScanning(false)
      setIsVideoReady(false)
    } else {
      await startScanning()
    }
  }, [isScanning, startScanning])

  // 手动重试
  const handleRetry = useCallback(async () => {
    try {
      setError('')

      // 先完全停止当前操作
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        const video = videoRef.current
        if (!video.paused) {
          video.pause()
        }
        video.srcObject = null
      }

      setIsScanning(false)
      setIsVideoReady(false)
      setIsInitializing(false)

      // 等待清理完成
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 重新开始扫描
      await startScanning()
    } catch (retryError) {
      console.error('重试失败:', retryError)
      const errorMessage = retryError instanceof Error ? retryError.message : '重试失败'
      setError(t('qr.errorDesc') + errorMessage)
    }
  }, [startScanning, t])

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        // 清理之前的错误
        setError('')

        // 使用QrScanner解析图片文件
        const result = await QrScanner.scanImage(file, {
          returnDetailedScanResult: true
        })

        if (result && result.data) {
          onScanResult(result.data)
          onClose()
        }
      } catch (e) {
        onScanResult('')
        onClose()
      } finally {
        // 重置input值，以便可以再次选择同一文件
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [onScanResult, onClose, t]
  )

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 关闭扫描器
  const handleClose = useCallback(() => {
    // 停止扫描
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // 停止视频流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    // 清理video元素
    if (videoRef.current) {
      const video = videoRef.current
      if (!video.paused) {
        video.pause()
      }
      video.srcObject = null
    }

    // 重置所有状态
    setIsScanning(false)
    setIsVideoReady(false)
    setIsInitializing(false)
    setError('')

    onClose()
  }, [onClose])

  // 组件挂载时自动开始扫描
  useEffect(() => {
    if (!isOpen) return

    let mounted = true

    const initializeScanner = async () => {
      try {
        // 延迟启动，确保组件完全挂载
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (mounted) {
          await startScanning()
        }
      } catch (initError) {
        console.error('初始化扫描器失败:', initError)
        if (mounted) {
          const errorMessage = initError instanceof Error ? initError.message : '初始化失败'
          setError(t('qr.errorDesc') + errorMessage)
        }
      }
    }

    initializeScanner()

    return () => {
      mounted = false
      // 停止扫描
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }

      // 停止视频流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        streamRef.current = null
      }

      // 清理video元素
      if (videoRef.current) {
        const video = videoRef.current
        if (!video.paused) {
          video.pause()
        }
        video.srcObject = null
      }

      setIsScanning(false)
      setIsVideoReady(false)
      setError('')
    }
  }, [isOpen]) // 只依赖isOpen

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('qr.title')}</h3>
            <Button onClick={handleClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* 摄像头预览区域 */}
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              {hasCamera ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                  {/* 隐藏的canvas用于二维码解析 */}
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <CameraOff className="h-12 w-12 mx-auto mb-2" />
                    <p>{t('qr.error')}</p>
                  </div>
                </div>
              )}

              {/* 加载指示器 */}
              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">{t('qr.loading')}</p>
                  </div>
                </div>
              )}

              {/* 扫描框指示器 */}
              {isScanning && !isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>

                    {/* 扫描线动画 */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="w-full h-0.5 bg-green-400 animate-pulse absolute top-1/2 transform -translate-y-1/2"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700 rounded-lg p-2">
                <p>{error}</p>
                <Button onClick={handleRetry} variant="ghost" size="sm" className="mt-2 text-red-400 hover:text-red-300">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('qr.retry')}
                </Button>
              </div>
            )}

            {/* 状态信息 */}
            <div className="text-center">
              {isInitializing ? (
                <p className="text-yellow-400 text-sm">{t('qr.loading')}</p>
              ) : isScanning ? (
                <p className="text-green-400 text-sm">{t('qr.scanning')}</p>
              ) : hasCamera ? (
                <p className="text-gray-400 text-sm">{t('qr.cameraStopped')}</p>
              ) : (
                <p className="text-gray-400 text-sm">{t('qr.checkPermissions')}</p>
              )}
            </div>

            {/* 控制按钮 */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {hasCamera && (
                  <Button
                    onClick={toggleScanning}
                    disabled={isInitializing}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <CameraOff className="h-4 w-4 mr-2" />
                        {t('qr.stopScanning')}
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        {t('qr.startScanning')}
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={triggerFileUpload} variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {t('qr.upload')}
                </Button>
              </div>
              <Button onClick={handleClose} variant="ghost" className="w-full text-gray-400 hover:text-white">
                {t('qr.cancel')}
              </Button>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
