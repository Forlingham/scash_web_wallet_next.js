'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useLanguageStore, type Language } from '@/stores/language-store'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Wallet Setup
    'wallet.title': 'SCASH Wallet',
    'wallet.subtitle': 'Community web wallet',
    'wallet.blockHeight': 'Block',
    'wallet.available': 'Available',
    'wallet.locked': 'Pending',
    'wallet.memPool': 'Mem Pool',
    'wallet.create': 'Create Wallet',
    'wallet.restore': 'Restore Wallet',
    'wallet.createNew': 'Create New Wallet',
    'wallet.restoreExisting': 'Restore Existing Wallet',
    'wallet.saveRecovery': 'Save Your Recovery Phrase',
    'wallet.writeDown': "Write down these 12 words in order and keep them safe. You'll need them to recover your wallet.",
    'wallet.clickReveal': 'Click to Reveal',
    'wallet.savedIt': "I've Saved It",
    'wallet.verifyPhrase': 'Verify Your Recovery Phrase',
    'wallet.enterWords': 'Please enter the following words from your recovery phrase:',
    'wallet.setPassword': 'Set Wallet Password',
    'wallet.passwordInfo': 'This password will encrypt your wallet file. Make sure to remember it!',
    'wallet.password': 'Password',
    'wallet.passwordInput': 'Enter password (min 8 characters)',
    'wallet.confirmPassword': 'Confirm password',
    'wallet.passwordTooShort': 'Password Too Short',
    'wallet.passwordMinLength': 'Password must be at least 8 characters long.',
    'wallet.passwordsDontMatch': "Passwords Don't Match",
    'wallet.passwordsDontMatchInfo': 'Please make sure both passwords are identical.',
    'wallet.downloadWallet': 'Download Your Wallet',
    'wallet.downloadInfo': 'Download your wallet file and keep it safe. You will need it to restore your wallet later.',
    'wallet.downloadButton': 'Download Wallet',
    'wallet.walletReady': 'Your encrypted wallet file is ready. Download and keep it safe!',
    'wallet.downloadFile': 'Download Wallet File',
    'wallet.needFile': "You'll need this file and your password to access your wallet later.",
    'wallet.restoreMethod': 'Restore Your Wallet',
    'wallet.chooseMethod': 'Choose how you want to restore your wallet:',
    'wallet.useRecovery': 'Use Recovery Phrase',
    'wallet.uploadFile': 'Upload Wallet File',
    'wallet.enterRecovery': 'Enter Recovery Phrase',
    'wallet.enter12Words': 'Enter your 12-word recovery phrase:',
    'wallet.uploadWalletFile': 'Upload Wallet File',
    'wallet.walletFile': 'Wallet File',
    'wallet.recoveryPhrase': 'Recovery Phrase',
    'wallet.selectFile': 'Select your previously downloaded wallet file:',
    'wallet.enterPassword': 'Enter Wallet Password',
    'wallet.passwordUsed': 'Enter the password you used to encrypt this wallet:',
    'wallet.unlockWallet': 'Unlock Wallet',
    'wallet.restoreWallet': 'Restore Wallet',
    'wallet.verificationFailed': 'Verification Failed',
    'wallet.verificationFailedInfo': 'Please check your words and try again.',
    'wallet.addressGenerationFailed': 'Address Generation Failed',
    'wallet.addressGenerationFailedInfo': 'Please try again.',

    // Wallet Lock
    'wallet.lock.title': 'Wallet Locked',
    'wallet.lock.passwordInfo': 'Enter your password to unlock',
    'wallet.lock.unlock': 'Unlock Wallet',
    'wallet.lock.input': 'Enter password',
    'wallet.lock.error': 'Invalid password',

    // Main Interface
    'nav.home': 'Home',
    'nav.assets': 'Assets',
    'nav.buy': 'Buy',
    'nav.sell': 'Sell',
    'nav.trade': 'Trade',
    'action.receive': 'Receive',
    'action.send': 'Send',
    'action.trade': 'Trade',
    'common.walletFunction': 'Wallet Functions',
    'balance.title': 'Balance',
    'transactions.recent': 'Recent Transactions',
    'transactions.openExplorer': 'Open in Explorer',
    'transactions.seeAll': 'See All',
    'transactions.received': 'Received',
    'transactions.sent': 'Sent',
    'transactions.memPool': 'Mem Pool',
    'transactions.particulars': 'View Details',
    'transactions.confirmations': 'Confirm',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.languageInfo': 'Change app language',
    'settings.backup': 'Backup Wallet',
    'settings.backupInfo': 'Backup wallet and recovery phrase',
    'settings.help': 'Help & Support',
    'settings.helpInfo': 'Get help and contact support',

    'settings.changePassword': 'Change Password',
    'settings.changePasswordInfo2': "After changing your password, you'll need to download a new wallet file",
    'settings.changePasswordInfo': 'Change wallet password',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmNewPassword': 'Confirm New Password',
    'settings.lock': 'Lock Wallet',
    'settings.lockInfo': 'Lock wallet to secure access',
    'settings.reset': 'Reset Wallet',
    'settings.resetInfo': 'Reset wallet to factory settings',
    'settings.resetConfirmTitle': 'Reset Wallet',
    'settings.resetConfirmInfo': 'This operation cannot be undone. Please make sure you have backed up your mnemonic phrase!',
    'settings.resetConfirm': 'Are you sure you want to reset your wallet? This will delete all local data.',
    'settings.backupConfirmTitle': 'Wallet Backup File',
    'settings.backupConfirmInfo': 'Download an encrypted backup of your wallet that includes your recovery phrase and settings.',
    'settings.backupConfirm': 'Download Backup File',
    'settings.inputPassword': 'Enter wallet password',
    'settings.passwordError': 'Wallet password is incorrect',
    'settings.verifyPassword': 'Verify wallet password',
    'settings.verifyPasswordInfo': 'Enter wallet password to verify',
    'settings.password': 'Wallet password',
    'settings.missingInformation': 'Please fill in all password fields',
    'settings.passwordMismatch': 'New password and confirmation must match',
    'settings.passwordChanged': 'Your wallet password has been updated successfully. Please download your new wallet file.',

    // Common
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.copy': 'Copy',
    'common.share': 'Share',
    'common.amount': 'Amount',
    'common.address': 'Address',
    'common.fee': 'Network Fee',
    'common.error': 'Error',
    'common.errorDesc': 'Please contact support team',
    'common.success': 'Success',
    'common.verify': 'Verify',
    'common.youHave': 'You have',

    // Send/Receive
    'send.title': 'Send',
    'send.from': 'Send from Wallet',
    'send.to': 'Send to Address',
    'send.toInfo': 'Enter the recipient address',
    'send.amount': 'Amount',
    'send.addAnother': 'Add Another Address',
    'send.fee': 'Network Fee',
    'send.total': 'Total',
    'send.confirm': 'Confirm Transaction',
    'send.slide': 'Slide to Confirm',
    'send.success': 'Transaction Sent!',
    'send.broadcast': 'Your transaction has been broadcast to the network',
    'send.rawTransaction': 'Raw Transaction',
    'send.backToHome': 'Back to Home',
    'send.amountExceed': 'Amount exceeds available balance',
    'send.feeDeducted': 'Network fee deducted from amount',
    'send.inputExceed': 'Input amount exceeds available balance',
    'send.confirmTransaction': 'Confirm Transaction',
    'send.inputPassword': 'Input Wallet Password',
    'send.confirmPay': 'Confirm Payment',
    'send.confirmTransactionTitle': 'Confirm Transaction',
    'send.send': 'Send',
    'send.confirmTransactionInfo': 'This operation cannot be undone. Please confirm that the transaction information is correct!',
    'send.cancel': 'Cancel',
    'send.confirmTransactionOn': 'Confirm Transaction',
    'send.backToEdit': 'Back to Edit',

    'receive.title': 'Receive',
    'receive.to': 'Receive to',
    'receive.request': 'Request Amount (Optional)',
    'receive.address': 'Your Wallet Address',
    'receive.tapEdit': 'Tap to edit',
    'receive.addressCopied': 'Address Copied',
    'receive.addressCopiedDesc': 'You can use this address in any application',

    // Transaction Details
    'transaction.details': 'Transaction Details',
    'transaction.sender': 'Sender Name',
    'transaction.amount': 'Amount',
    'transaction.amountUsd': 'Amount in USD',
    'transaction.currentPrice': 'Amount at Current Price',
    'transaction.date': 'Date',
    'transaction.wallet': 'Wallet',
    'transaction.category': 'Category',
    'transaction.note': 'Note',
    'transaction.addNote': 'Tap to Add Note (Optional)',
    'transaction.status': 'Status',
    'transaction.completed': 'Transaction Completed',
    'transaction.pending': 'Transaction Pending',
    'transaction.failed': 'Transaction Failed',
    'transaction.id': 'Transaction ID',
    'transaction.noTransactions': 'No transactions found',
    'transaction.adjustFilter': 'Try adjusting your search or filter',
    'filter.all': 'All',
    'filter.received': 'Received',
    'filter.sent': 'Sent',

    'common.supportAuthor': 'Support the author',
    'common.supportAuthorDesc':
      'Your donations not only support the developer but also serve as a driving force for new features, contributing to the growth of the SCASH community.',
    'common.copySuccess': 'Copy Success',
    'common.addressCopied': 'Address Copied',
    'common.walletInfo': 'Non-custodial cryptocurrency wallet',
    'common.contactSupport': 'Contact Support',
    'common.contactSupportDesc': 'Need additional help? Contact our support team for personalized assistance.',
    'common.contactSupportGitHub': 'Contact Support on GitHub',
    'common.contactSupportTelegram': 'Contact Support on Telegram',

    'safety.instructions': `
    <section>
  <h2>Wallet Security and Signing Statement</h2>
  <p>This wallet is designed with <strong>security as the top priority</strong>, reflected in the following principles:</p>

  <h3>1. Local Encrypted Storage</h3>
  <ul>
    <li>Wallet files are encrypted with <strong>AES encryption</strong> and can only be decrypted with the user’s password.</li>
    <li>The password is never transmitted over the network, ensuring wallet data fully belongs to the user.</li>
  </ul>

  <h3>2. Private Keys Never Leave the Device</h3>
  <ul>
    <li>All <strong>mnemonics and private keys</strong> remain strictly on the user’s device.</li>
    <li>They are never uploaded to servers or exposed to any external network.</li>
    <li>Even backend services cannot access private keys or mnemonics.</li>
  </ul>

  <h3>3. Offline Signing Mechanism</h3>
  <ul>
    <li>The signing process is completed entirely <strong>locally and offline</strong>.</li>
    <li>Transactions can be signed <strong>without any network connection</strong>.</li>
    <li>After signing, only the raw transaction (RawTx) is broadcast to the SCASH network.</li>
  </ul>

  <h3>4. Security Philosophy Comparable to Hardware Wallets</h3>
  <ul>
    <li>Hardware wallets sign transactions inside the device; this wallet signs locally on the user’s device.</li>
    <li>In both cases, <strong>private keys are never exposed</strong>, ensuring complete user control.</li>
  </ul>

  <blockquote>As long as the user’s device remains secure, their digital assets will always be safe.</blockquote>
</section>
    `,
    'Technical.Overview': `
     <section>
  <h2>Technical Overview</h2>
  <p>The wallet is built with a modern technology stack and architecture, ensuring high performance, scalability, and a smooth user experience:</p>

  <h3>1. Frontend</h3>
  <ul>
    <li>Developed with <strong>Next.js</strong>, offering server-side rendering and static site generation for optimal performance.</li>
    <li>Wallet data is stored locally on the user’s device, encrypted with <strong>AES</strong> for security.</li>
    <li>Transaction signing is performed entirely <strong>locally on the frontend</strong>, independent of backend servers.</li>
  </ul>

  <h3>2. Backend Services</h3>
  <ul>
    <li>Implemented with <strong>Nest.js</strong>, handling secure communication with SCASH nodes.</li>
    <li>Uses <strong>Prisma</strong> for database access, enabling lightweight data storage and queries.</li>
    <li>The backend only provides blockchain data and transaction broadcasting, never handling private keys or mnemonics.</li>
  </ul>

  <h3>3. Blockchain Interaction</h3>
  <ul>
    <li>Integrates with SCASH via <strong>RPC</strong>, supporting transaction queries, balance checks, and broadcasting.</li>
    <li>Address validation, transaction signing, and UTXO management follow Bitcoin-compatible standards.</li>
  </ul>

  <h3>4. Architectural Principles</h3>
  <ul>
    <li>Frontend and backend separation for scalability and security.</li>
    <li>Local signing + node broadcasting ensures private data never leaves the user’s device.</li>
    <li>A simple and clear design makes it accessible to both developers and community users.</li>
  </ul>

  <blockquote>With this architecture, we aim to deliver a secure, transparent, and user-friendly wallet for the SCASH community.</blockquote>
</section>
     `
  },
  zh: {
    // Wallet Setup
    'wallet.title': 'SCASH 钱包',
    'wallet.subtitle': '社区 web 钱包',
    'wallet.blockHeight': '区块高度',
    'wallet.available': '可用',
    'wallet.locked': '待确认',
    'wallet.memPool': '内存池',
    'wallet.create': '创建钱包',
    'wallet.restore': '恢复钱包',
    'wallet.createNew': '创建新钱包',
    'wallet.restoreExisting': '恢复现有钱包',
    'wallet.saveRecovery': '保存您的恢复短语',
    'wallet.writeDown': '按顺序写下这12个单词并妥善保管。您需要它们来恢复钱包。',
    'wallet.clickReveal': '点击显示',
    'wallet.savedIt': '我已保存',
    'wallet.verifyPhrase': '验证您的恢复短语',
    'wallet.enterWords': '请输入恢复短语中的以下单词：',
    'wallet.setPassword': '设置钱包密码',
    'wallet.passwordInfo': '此密码将加密您的钱包文件。请确保记住它！',
    'wallet.password': '密码',
    'wallet.passwordInput': '输入密码（最小8个字符）',
    'wallet.confirmPassword': '确认密码',
    'wallet.passwordTooShort': '密码太短',
    'wallet.passwordMinLength': '密码必须至少8个字符长。',
    'wallet.passwordsDontMatch': '密码不匹配',
    'wallet.passwordsDontMatchInfo': '请确保两个密码相同。',
    'wallet.downloadWallet': '下载您的钱包',
    'wallet.downloadInfo': '下载您的钱包文件并妥善保管。您稍后需要它来恢复钱包。',
    'wallet.downloadButton': '下载钱包',
    'wallet.walletReady': '您的加密钱包文件已准备就绪。下载并妥善保管！',
    'wallet.downloadFile': '下载钱包文件',
    'wallet.needFile': '您稍后需要此文件和密码来访问钱包。',
    'wallet.restoreMethod': '恢复您的钱包',
    'wallet.chooseMethod': '选择恢复钱包的方式：',
    'wallet.useRecovery': '使用恢复短语',
    'wallet.uploadFile': '上传钱包文件',
    'wallet.enterRecovery': '输入恢复短语',
    'wallet.enter12Words': '输入您的12个单词恢复短语：',
    'wallet.uploadWalletFile': '上传钱包文件',
    'wallet.walletFile': '钱包文件',
    'wallet.recoveryPhrase': '恢复短语',
    'wallet.selectFile': '选择您之前下载的钱包文件：',
    'wallet.enterPassword': '输入钱包密码',
    'wallet.passwordUsed': '输入您用于加密此钱包的密码：',
    'wallet.unlockWallet': '解锁钱包',
    'wallet.restoreWallet': '恢复钱包',
    'wallet.verificationFailed': '验证失败',
    'wallet.verificationFailedInfo': '请检查您的单词并再次尝试。',
    'wallet.addressGenerationFailed': '地址生成失败',
    'wallet.addressGenerationFailedInfo': '请尝试重新创建钱包。',

    // Wallet Lock
    'wallet.lock.title': '钱包已锁定',
    'wallet.lock.passwordInfo': '输入您的密码以解锁',
    'wallet.lock.unlock': '解锁钱包',
    'wallet.lock.input': '请输入密码',
    'wallet.lock.error': '密码错误',

    // Main Interface
    'nav.home': '首页',
    'nav.assets': '资产',
    'nav.buy': '购买',
    'nav.sell': '出售',
    'nav.trade': '交易',
    'action.receive': '收款',
    'action.send': '发送',
    'action.trade': '交易',
    'common.walletFunction': '钱包功能',
    'balance.title': '余额',
    'transactions.recent': '最近交易',
    'transactions.openExplorer': '打开区块链浏览器',
    'transactions.seeAll': '查看全部',
    'transactions.received': '已收到',
    'transactions.sent': '已发送',
    'transactions.memPool': '内存池中',
    'transactions.particulars': '查看详情',
    'transactions.confirmations': '确认数',

    // Settings
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.languageInfo': '更改应用语言',
    'settings.backup': '备份钱包',
    'settings.backupInfo': '备份钱包和恢复短语',
    'settings.help': '帮助 & 支持',
    'settings.helpInfo': '获取帮助和联系支持',
    'settings.changePassword': '修改密码',
    'settings.changePasswordInfo2': '修改密码后，您需要下载新的钱包文件',
    'settings.changePasswordInfo': '更改钱包密码',
    'settings.currentPassword': '当前密码',
    'settings.newPassword': '新密码',
    'settings.confirmNewPassword': '确认新密码',
    'settings.lock': '锁定钱包',
    'settings.lockInfo': '锁定钱包以安全访问',
    'settings.reset': '重置钱包',
    'settings.resetInfo': '重置钱包到出厂设置',
    'settings.resetConfirmTitle': '确认重置钱包',
    'settings.resetConfirmInfo': '此操作无法撤销，请确保已备份助记词！',
    'settings.resetConfirm': '您确定要重置您的钱包吗？这将删除所有本地数据。',
    'settings.backupConfirmTitle': '备份钱包文件',
    'settings.backupConfirmInfo': '下载加密备份文件，包括您的恢复短语和设置。',
    'settings.backupConfirm': '下载备份文件',
    'settings.inputPassword': '请输入当前钱包密码',
    'settings.passwordError': '钱包密码错误，请重试',
    'settings.verifyPassword': '验证钱包密码',
    'settings.verifyPasswordInfo': '为了保护您的助记词安全，请输入钱包密码进行验证。',
    'settings.password': '钱包密码',
    'settings.missingInformation': '请填写所有密码字段',
    'settings.passwordMismatch': '新密码和确认密码必须匹配',
    'settings.passwordChanged': '您的钱包密码已更新成功。请下载您的新钱包文件。',

    // Common
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.next': '下一步',
    'common.back': '返回',
    'common.copy': '复制',
    'common.share': '分享',
    'common.amount': '金额',
    'common.address': '地址',
    'common.fee': '网络费用',
    'common.error': '错误',
    'common.errorDesc': '请联系支持团队',
    'common.success': '成功',
    'common.verify': '验证',
    'common.youHave': '您有',

    // Send/Receive
    'send.title': '发送',
    'send.from': '从钱包发送',
    'send.to': '发送到地址',
    'send.toInfo': '输入接收方地址',
    'send.amount': '金额',
    'send.addAnother': '添加另一个地址',
    'send.fee': '网络费用',
    'send.total': '总计',
    'send.confirm': '确认交易',
    'send.slide': '滑动以确认',
    'send.success': '交易已发送！',
    'send.broadcast': '您的交易已广播到网络',
    'send.rawTransaction': '原始交易',
    'send.backToHome': '返回首页',

    'send.amountExceed': ' 金额超出可用余额',
    'send.feeDeducted': '手续费从金额中扣除',
    'send.inputExceed': '输入的金额大于余额',
    'send.confirmTransaction': '输入密码确认交易',
    'send.inputPassword': '请输入钱包密码',
    'send.confirmPay': '确认支付',
    'send.confirmTransactionTitle': '确认交易',
    'send.send': '您即将发送',
    'send.confirmTransactionInfo': '此操作不可撤销，请确认交易信息无误。',
    'send.cancel': '取消',
    'send.confirmTransactionOn': '确认交易',
    'send.backToEdit': '返回编辑',

    'receive.title': '收款',
    'receive.to': '收款到',
    'receive.request': '请求金额（可选）',
    'receive.address': '您的钱包地址',
    'receive.tapEdit': '点击编辑',
    'receive.addressCopied': '地址已复制',
    'receive.addressCopiedDesc': '您可以在任何应用程序中使用此地址',

    // Transaction Details
    'transaction.details': '交易详情',
    'transaction.sender': '发送方名称',
    'transaction.amount': '金额',
    'transaction.amountUsd': '美元金额',
    'transaction.currentPrice': '当前价格金额',
    'transaction.date': '日期',
    'transaction.wallet': '钱包',
    'transaction.category': '类别',
    'transaction.note': '备注',
    'transaction.addNote': '点击添加备注（可选）',
    'transaction.status': '状态',
    'transaction.completed': '交易完成',
    'transaction.pending': '交易待处理',
    'transaction.failed': '交易失败',
    'transaction.id': '交易ID',
    'transaction.noTransactions': '未找到交易',
    'transaction.adjustFilter': '尝试调整搜索或筛选条件',
    'filter.all': '全部',
    'filter.received': '已收到',
    'filter.sent': '已发送',

    'common.supportAuthor': '支持作者',
    'common.supportAuthorDesc': '大家的捐赠不仅是对作者的支持，更是推动新功能开发的动力，为 SCASH 社区的发展贡献一份力量。',
    'common.copySuccess': '复制成功',
    'common.addressCopied': '地址已复制',
    "common.walletInfo":"非托管web钱包",
    "common.contactSupport":"联系我们",
    "common.contactSupportDesc":"遇到问题可以在GitHub上进行提交和在Telegram群中进行留言。",
    "common.contactSupportGitHub":"GitHub项目",
    "common.contactSupportTelegram":"Telegram群组",

    'safety.instructions': `
    <section>
  <h2 className="text-white font-medium mb-2">钱包安全与签名说明</h2>
  <p>本钱包以 <strong>安全性</strong> 为首要设计原则，主要体现在以下几个方面：</p>

  <h3>1. 本地加密存储</h3>
  <ul>
    <li>钱包文件使用 <strong>AES 加密</strong>，只能通过用户密码解密。</li>
    <li>用户密码从不通过网络传输，确保钱包数据完全属于用户本人。</li>
  </ul>

  <h3>2. 私钥绝不离开设备</h3>
  <ul>
    <li>所有 <strong>助记词和私钥</strong> 都严格保存在用户本地设备。</li>
    <li>不会上传至服务器，也不会暴露给任何外部网络。</li>
    <li>即使是钱包的后台服务也无法获取用户的私钥和助记词。</li>
  </ul>

  <h3>3. 离线签名机制</h3>
  <ul>
    <li>交易签名过程完全在 <strong>本地、离线环境</strong> 中完成。</li>
    <li>即使设备 <strong>没有网络连接</strong>，也可以完成签名。</li>
    <li>签名完成后，仅会将原始交易（RawTx）广播到 SCASH 网络。</li>
  </ul>

  <h3>4. 与硬件钱包一致的安全理念</h3>
  <ul>
    <li>硬件钱包在设备内部完成签名，本钱包在用户设备本地完成签名。</li>
    <li>两者的共同点是：<strong>私钥从不暴露</strong>，用户始终掌控安全。</li>
  </ul>

  <blockquote>只要用户设备保持安全，数字资产就始终处于安全保护之下。</blockquote>
</section>
    `,
    'Technical.Overview': `
    <section>
  <h2>技术介绍</h2>
  <p>本钱包采用现代化的技术栈与架构，确保系统的高性能、可扩展性与良好的用户体验：</p>

  <h3>1. 前端技术</h3>
  <ul>
    <li>基于 <strong>Next.js</strong> 构建，提供高性能的服务端渲染与静态生成。</li>
    <li>钱包数据在用户本地加密存储，并使用 <strong>AES</strong> 进行加密保护。</li>
    <li>交易的签名过程在 <strong>前端本地</strong> 完成，不依赖外部服务器。</li>
  </ul>

  <h3>2. 后端服务</h3>
  <ul>
    <li>基于 <strong>Nest.js</strong> 框架开发，负责与 SCASH 节点进行安全通讯。</li>
    <li>采用 <strong>Prisma</strong> 进行数据库操作，用于轻量级的数据存储与查询。</li>
    <li>后端仅提供链上数据和交易广播接口，不接触用户的私钥和助记词。</li>
  </ul>

  <h3>3. 区块链交互</h3>
  <ul>
    <li>通过 <strong>SCASH RPC</strong> 与区块链节点交互，支持交易查询、余额获取和广播。</li>
    <li>地址验证、交易签名与 UTXO 处理均符合比特币兼容规范。</li>
  </ul>

  <h3>4. 架构理念</h3>
  <ul>
    <li>前后端分离，提升系统扩展性和安全性。</li>
    <li>本地签名 + 节点广播的模式，确保用户数据不出本地环境。</li>
    <li>整体设计简洁、清晰，便于社区开发者和用户使用。</li>
  </ul>

  <blockquote>我们希望通过这一技术架构，为 SCASH 社区提供一个安全、透明且易用的钱包解决方案。</blockquote>
</section>
    `
  },
  ru: {
    // Wallet Setup
    'wallet.title': 'SCASH Кошелек',
    'wallet.subtitle': 'Комьюнити веб-кошелек',
    'wallet.blockHeight': 'Блоки',
    'wallet.available': 'Доступно',
    'wallet.locked': 'В ожидании',
    'wallet.memPool': 'Пул транзакций',
    'wallet.create': 'Создать кошелек',
    'wallet.restore': 'Восстановить кошелек',
    'wallet.createNew': 'Создать новый кошелек',
    'wallet.restoreExisting': 'Восстановить существующий кошелек',
    'wallet.saveRecovery': 'Сохраните вашу фразу восстановления',
    'wallet.writeDown': 'Запишите эти 12 слов по порядку и храните их в безопасности. Они понадобятся для восстановления кошелька.',
    'wallet.clickReveal': 'Нажмите, чтобы показать',
    'wallet.savedIt': 'Я сохранил',
    'wallet.verifyPhrase': 'Проверьте вашу фразу восстановления',
    'wallet.enterWords': 'Пожалуйста, введите следующие слова из вашей фразы восстановления:',
    'wallet.setPassword': 'Установите пароль кошелька',
    'wallet.passwordInfo': 'Этот пароль зашифрует ваш файл кошелька. Обязательно запомните его!',
    'wallet.password': 'Пароль',
    'wallet.passwordInput': 'Введите пароль (минимальная длина 8 символов)',
    'wallet.confirmPassword': 'Подтвердите пароль',
    'wallet.passwordTooShort': 'Пароль слишком короткий',
    'wallet.passwordMinLength': 'Пароль должен быть не менее 8 символов.',
    'wallet.passwordsDontMatch': 'Пароли не совпадают',
    'wallet.passwordsDontMatchInfo': 'Пожалуйста, убедитесь, что оба пароля идентичны.',
    'wallet.downloadWallet': 'Скачайте ваш кошелек',
    'wallet.downloadInfo':
      'Скачайте ваш файл кошелька и храните его в безопасности. Вы сможете использовать его позже для восстановления кошелька.',
    'wallet.downloadButton': 'Скачать файл кошелька',
    'wallet.walletReady': 'Ваш зашифрованный файл кошелька готов. Скачайте и храните его в безопасности!',
    'wallet.downloadFile': 'Скачать файл кошелька',
    'wallet.needFile': 'Вам понадобится этот файл и пароль для доступа к кошельку позже.',
    'wallet.restoreMethod': 'Восстановите ваш кошелек',
    'wallet.chooseMethod': 'Выберите способ восстановления кошелька:',
    'wallet.useRecovery': 'Использовать фразу восстановления',
    'wallet.uploadFile': 'Загрузить файл кошелька',
    'wallet.enterRecovery': 'Введите фразу восстановления',
    'wallet.enter12Words': 'Введите вашу фразу восстановления из 12 слов:',
    'wallet.uploadWalletFile': 'Загрузить файл кошелька',
    'wallet.walletFile': 'Файл кошелька',
    'wallet.recoveryPhrase': 'Фраза восстановления',
    'wallet.selectFile': 'Выберите ранее скачанный файл кошелька:',
    'wallet.enterPassword': 'Введите пароль кошелька',
    'wallet.passwordUsed': 'Введите пароль, который вы использовали для шифрования этого кошелька:',
    'wallet.unlockWallet': 'Разблокировать кошелек',
    'wallet.restoreWallet': 'Восстановить кошелек',
    'wallet.verificationFailed': 'Верификация не удалась',
    'wallet.verificationFailedInfo': 'Пожалуйста, проверьте ваши слова и попробуйте снова.',
    'wallet.addressGenerationFailed': 'Генерация адреса не удалась',
    'wallet.addressGenerationFailedInfo': 'Пожалуйста, попробуйте снова.',

    // Wallet Lock
    'wallet.lock.title': 'Кошелек заблокирован',
    'wallet.lock.passwordInfo': 'Введите пароль для разблокировки',
    'wallet.lock.unlock': 'Разблокировать кошелек',
    'wallet.lock.input': 'Введите пароль',
    'wallet.lock.error': 'Неверный пароль',

    // Main Interface
    'nav.home': 'Главная',
    'nav.assets': 'Активы',
    'nav.buy': 'Купить',
    'nav.sell': 'Продать',
    'nav.trade': 'Торговля',
    'action.receive': 'Получить',
    'action.send': 'Отправить',
    'action.trade': 'Торговля',
    'common.walletFunction': 'Функции кошелька',
    'balance.title': 'Баланс',
    'transactions.recent': 'Последние транзакции',
    'transactions.openExplorer': 'Открыть в блокчейн-браузере',
    'transactions.seeAll': 'Показать все',
    'transactions.received': 'Получено',
    'transactions.sent': 'Отправлено',
    'transactions.memPool': 'Пул транзакций',
    'transactions.particulars': 'Показать детали',
    'transactions.confirmations': 'Подтверждения',

    // Settings
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.languageInfo': 'Изменить язык приложения',
    'settings.backup': 'Резервная копия кошелька',
    'settings.backupInfo': 'Резервная копия кошелька и фразы восстановления',
    'settings.help': 'Помощь & Поддержка',
    'settings.helpInfo': 'Получить помощь и связаться с поддержкой',
    'settings.changePassword': 'Изменить пароль',
    'settings.changePasswordInfo2': 'После того, как ты поменяешь пароль, тебе нужно будет загрузить новые бумажные файлы',
    'settings.changePasswordInfo': 'Изменить пароль кошелька',
    'settings.currentPassword': 'Текущий пароль',
    'settings.newPassword': 'Новый пароль',
    'settings.confirmNewPassword': 'Подтвердите новый пароль',
    'settings.lock': 'Заблокировать кошелек',
    'settings.lockInfo': 'Заблокировать кошелек для безопасности',
    'settings.reset': 'Сбросить кошелек',
    'settings.resetInfo': 'Сбросить кошелек к заводским настройкам',
    'settings.resetConfirmTitle': 'Сбросить кошелек',
    'settings.resetConfirmInfo': 'Это действие нельзя отменить. Убедитесь, что вы сделали резервную копию вашего кошелька!',
    'settings.resetConfirm': 'Вы уверены, что хотите сбросить кошелек? Это удалит все локальные данные.',
    'settings.backupConfirmTitle': 'Резервная копия кошелька',
    'settings.backupConfirmInfo': 'Скачайте резервную копию вашего кошелька и фразы восстановления.',
    'settings.backupConfirm': 'Скачать резервную копию',
    'settings.inputPassword': 'Введите пароль кошелька',
    'settings.passwordError': 'Пароль кошелька неверен',
    'settings.verifyPassword': 'Верифицировать пароль кошелька',
    'settings.verifyPasswordInfo': 'Введите пароль кошелька для проверки',
    'settings.password': 'Пароль кошелька',
    'settings.missingInformation': 'Пожалуйста, заполните все поля',
    'settings.passwordMismatch': 'Пароли не совпадают',
    'settings.passwordChanged': 'Пароль успешно изменен',

    // Common
    'common.confirm': 'Подтвердить',
    'common.cancel': 'Отмена',
    'common.next': 'Далее',
    'common.back': 'Назад',
    'common.copy': 'Копировать',
    'common.share': 'Поделиться',
    'common.amount': 'Сумма',
    'common.address': 'Адрес',
    'common.fee': 'Комиссия сети',
    'common.error': 'Ошибка',
    'common.errorDesc': 'Пожалуйста, свяжитесь с поддержкой',
    'common.success': 'Успех',
    'common.verify': 'Верифицировать',
    'common.youHave': 'У вас есть',

    // Send/Receive
    'send.title': 'Отправить',
    'send.from': 'Отправить из кошелька',
    'send.to': 'Отправить на адрес',
    'send.toInfo': 'Введите адрес получателя',
    'send.amount': 'Сумма',
    'send.addAnother': 'Добавить еще один адрес',
    'send.fee': 'Комиссия сети',
    'send.total': 'Итого',
    'send.confirm': 'Подтвердить транзакцию',
    'send.slide': 'Проведите для подтверждения',
    'send.success': 'Транзакция отправлена!',
    'send.broadcast': 'Ваша транзакция отправлена в сеть',
    'send.rawTransaction': 'Сырая транзакция',
    'send.backToHome': 'Вернуться на главную',
    'send.amountExceed': 'Сумма превышает доступный баланс',
    'send.feeDeducted': 'Комиссия сети из суммы вычтена',
    'send.inputExceed': 'Введенная сумма превышает доступный баланс',
    'send.confirmTransaction': 'Подтвердите транзакцию',
    'send.inputPassword': 'Введите пароль кошелька',
    'send.confirmPay': 'Подтвердите оплату',
    'send.confirmTransactionTitle': 'Подтвердите транзакцию',
    'send.send': 'send',
    'send.confirmTransactionInfo': 'Операция не отменяется, подтвердите, что информация о сделке достоверна!',
    'send.cancel': 'Отмена',
    'send.confirmTransactionOn': 'Подтвердить транзакцию',
    'send.backToEdit': 'Вернуться к редактированию',

    'receive.title': 'Получить',
    'receive.to': 'Получить на',
    'receive.request': 'Запросить сумму (необязательно)',
    'receive.address': 'Адрес вашего кошелька',
    'receive.tapEdit': 'Нажмите для редактирования',
    'receive.addressCopied': 'Адрес скопирован',
    'receive.addressCopiedDesc': 'Вы можете использовать этот адрес в любой приложении',

    // Transaction Details
    'transaction.details': 'Детали транзакции',
    'transaction.sender': 'Имя отправителя',
    'transaction.amount': 'Сумма',
    'transaction.amountUsd': 'Сумма в USD',
    'transaction.currentPrice': 'Сумма по текущей цене',
    'transaction.date': 'Дата',
    'transaction.wallet': 'Кошелек',
    'transaction.category': 'Категория',
    'transaction.note': 'Заметка',
    'transaction.addNote': 'Нажмите, чтобы добавить заметку (необязательно)',
    'transaction.status': 'Статус',
    'transaction.completed': 'Транзакция завершена',
    'transaction.pending': 'Транзакция в ожидании',
    'transaction.failed': 'Транзакция не удалась',
    'transaction.id': 'ID транзакции',
    'transaction.noTransactions': 'Транзакции не найдены',
    'transaction.adjustFilter': 'Попробуйте изменить поиск или фильтр',
    'filter.all': 'Все',
    'filter.received': 'Получено',
    'filter.sent': 'Отправлено',

    'common.supportAuthor': 'Поддержать автора',
    'common.supportAuthorDesc':
      'Ваши пожертвования не только поддерживают разработчика, но и становятся движущей силой для создания новых функций, внося вклад в развитие сообщества SCASH.',
    'common.copySuccess': 'Копирование успешное',
    'common.addressCopied': 'Адрес скопирован',
    'common.walletInfo': 'Не управляемый веб-кошелек',
    'common.contactSupport': 'Связаться с поддержкой',
    'common.contactSupportDesc': 'Если у вас возникли проблемы, вы можете связаться с нашей поддержкой через GitHub или Telegram.',
    'common.contactSupportGitHub': 'Связаться с поддержкой на GitHub',
    'common.contactSupportTelegram': 'Связаться с поддержкой на Telegram',
    

    'safety.instructions': `
    <section>
  <h2>Безопасность кошелька и процесс подписи</h2>
  <p>Наш кошелёк разработан с <strong>приоритетом безопасности</strong>, основываясь на следующих принципах:</p>

  <h3>1. Локальное зашифрованное хранение</h3>
  <ul>
    <li>Файлы кошелька шифруются с помощью <strong>AES</strong>, доступ возможен только с паролем пользователя.</li>
    <li>Пароль никогда не передаётся через сеть, данные кошелька полностью принадлежат пользователю.</li>
  </ul>

  <h3>2. Приватные ключи никогда не покидают устройство</h3>
  <ul>
    <li>Все <strong>мнемонические фразы и приватные ключи</strong> хранятся исключительно на устройстве пользователя.</li>
    <li>Они не загружаются на сервер и не передаются по сети.</li>
    <li>Даже серверные сервисы кошелька не имеют доступа к приватным ключам или мнемоникам.</li>
  </ul>

  <h3>3. Механизм оффлайн-подписи</h3>
  <ul>
    <li>Подписание транзакций выполняется полностью <strong>локально и оффлайн</strong>.</li>
    <li>Транзакции можно подписывать даже <strong>без подключения к сети</strong>.</li>
    <li>После подписи в сеть SCASH передаётся только готовая транзакция (RawTx).</li>
  </ul>

  <h3>4. Философия безопасности, сопоставимая с аппаратными кошельками</h3>
  <ul>
    <li>Аппаратный кошелёк подписывает транзакции внутри устройства, наш кошелёк делает это локально на устройстве пользователя.</li>
    <li>В обоих случаях <strong>приватный ключ никогда не раскрывается</strong>, что гарантирует полный контроль пользователя.</li>
  </ul>

  <blockquote>Пока устройство пользователя остаётся в безопасности, его цифровые активы также надёжно защищены.</blockquote>
</section>
    `,
    'Technical.Overview': `
     <section>
  <h2>Технический обзор</h2>
  <p>Кошелёк построен на современной технологической базе и архитектуре, что обеспечивает высокую производительность, масштабируемость и удобство использования:</p>

  <h3>1. Фронтенд</h3>
  <ul>
    <li>Разработан на <strong>Next.js</strong>, поддерживает серверный рендеринг и генерацию статических страниц для максимальной скорости.</li>
    <li>Данные кошелька хранятся локально на устройстве пользователя и шифруются с помощью <strong>AES</strong>.</li>
    <li>Подпись транзакций выполняется полностью <strong>локально во фронтенде</strong>, без участия серверов.</li>
  </ul>

  <h3>2. Бэкенд-сервисы</h3>
  <ul>
    <li>Реализован с использованием <strong>Nest.js</strong>, обеспечивает безопасное взаимодействие с узлами SCASH.</li>
    <li>Для работы с базой данных применяется <strong>Prisma</strong>, что позволяет хранить и обрабатывать лёгкие данные.</li>
    <li>Бэкенд предоставляет только доступ к блокчейн-данным и возможность отправки транзакций, но не работает с приватными ключами или мнемониками.</li>
  </ul>

  <h3>3. Взаимодействие с блокчейном</h3>
  <ul>
    <li>Интеграция через <strong>RPC</strong> SCASH: поддерживаются запросы транзакций, проверка баланса и трансляция транзакций.</li>
    <li>Проверка адресов, подпись транзакций и работа с UTXO полностью совместимы со стандартами Bitcoin.</li>
  </ul>

  <h3>4. Архитектурные принципы</h3>
  <ul>
    <li>Разделение фронтенда и бэкенда для повышения безопасности и масштабируемости.</li>
    <li>Локальная подпись + трансляция через узел гарантируют, что приватные данные никогда не покидают устройство пользователя.</li>
    <li>Простая и понятная архитектура делает кошелёк удобным как для разработчиков, так и для сообщества.</li>
  </ul>

  <blockquote>Мы стремимся предоставить сообществу SCASH безопасный, прозрачный и удобный кошелёк на основе этой архитектуры.</blockquote>
</section>
     `
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)['en']] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
