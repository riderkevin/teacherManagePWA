import { useState } from 'react'
import { useLoad } from '@tarojs/taro'
import { WebView } from '@tarojs/components'

export default function WebviewPage() {
  const [src, setSrc] = useState('')

  useLoad((options: Record<string, string> = {}) => {
    if (options.url) {
      setSrc(decodeURIComponent(options.url))
    }
  })

  if (!src) return null

  return <WebView src={src} />
}
