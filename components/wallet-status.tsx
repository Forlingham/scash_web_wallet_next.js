'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWalletStore, useWalletActions, useWalletState } from '@/stores/wallet-store'
import { Wallet, Lock, Unlock, RefreshCw } from 'lucide-react'

/**
 * 钱包状态展示组件 - 演示如何使用类似 Pinia 的状态管理
 * 
 * 这个组件展示了：
 * 1. 响应式状态读取
 * 2. 状态操作方法调用
 * 3. 计算属性（getters）的使用
 * 4. 持久化状态的自动恢复
 */
export function WalletStatus() {
  // 使用状态 - 类似 Pinia 的 storeToRefs
  const {
    wallet,
    isLoading,
    error,
    formattedBalance,
    recentTransactions,
    isConnected
  } = useWalletState()
  
  // 使用操作方法 - 类似 Pinia 的 actions
  const {
    updateBalance,
    lockWallet,
    unlockWallet,
    clearWallet,
    setLoading,
    addTransaction
  } = useWalletActions()
  
  // 模拟更新余额
  const handleUpdateBalance = () => {
    setLoading(true)
    setTimeout(() => {
      const newBalance = Math.floor(Math.random() * 100000000) // 随机余额
      updateBalance(newBalance)
      setLoading(false)
    }, 1000)
  }
  
  // 模拟添加交易
  const handleAddTransaction = () => {
    const transaction = {
      id: Date.now().toString(),
      type: Math.random() > 0.5 ? 'send' : 'receive' as const,
      amount: Math.floor(Math.random() * 10000000),
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      timestamp: Date.now(),
      status: 'confirmed' as const
    }
    addTransaction(transaction)
  }
  
  // 解锁钱包
  const handleUnlock = async () => {
    const success = await unlockWallet('password123')
    if (success) {
      console.log('钱包已解锁')
    }
  }
  
  if (!wallet) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            钱包状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">未连接钱包</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 钱包基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              钱包状态
            </span>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? '已连接' : '已锁定'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">地址</label>
            <p className="font-mono text-sm break-all">{wallet.address}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">余额</label>
            <p className="text-2xl font-bold">{formattedBalance} BTC</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleUpdateBalance} 
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              更新余额
            </Button>
            
            <Button 
              onClick={handleAddTransaction}
              size="sm"
              variant="outline"
            >
              添加交易
            </Button>
            
            {wallet.isLocked ? (
              <Button 
                onClick={handleUnlock}
                size="sm"
                variant="outline"
              >
                <Unlock className="h-4 w-4" />
                解锁
              </Button>
            ) : (
              <Button 
                onClick={lockWallet}
                size="sm"
                variant="outline"
              >
                <Lock className="h-4 w-4" />
                锁定
              </Button>
            )}
            
            <Button 
              onClick={clearWallet}
              size="sm"
              variant="destructive"
            >
              清除钱包
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              错误: {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 最近交易 */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <Badge variant={tx.type === 'send' ? 'destructive' : 'default'}>
                      {tx.type === 'send' ? '发送' : '接收'}
                    </Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono ${tx.type === 'send' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'send' ? '-' : '+'}{(tx.amount / 100000000).toFixed(8)} BTC
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 使用示例的说明组件
export function WalletStoreExample() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Zustand 钱包状态管理示例</h2>
        <p className="text-muted-foreground">
          这个组件展示了如何使用类似 Vue Pinia 的状态管理方式
        </p>
      </div>
      
      <WalletStatus />
      
      <Card>
        <CardHeader>
          <CardTitle>特性说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold">🔄 响应式状态</h4>
            <p className="text-sm text-muted-foreground">
              状态变化会自动更新所有使用该状态的组件，类似 Pinia 的响应式系统
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">💾 自动持久化</h4>
            <p className="text-sm text-muted-foreground">
              钱包信息自动保存到 localStorage，刷新页面后状态会自动恢复
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">🎯 类型安全</h4>
            <p className="text-sm text-muted-foreground">
              完整的 TypeScript 支持，提供类型提示和编译时检查
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold">🔐 安全性</h4>
            <p className="text-sm text-muted-foreground">
              敏感信息（私钥、助记词）不会持久化到本地存储
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}