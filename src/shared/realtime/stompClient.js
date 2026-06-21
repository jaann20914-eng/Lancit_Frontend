import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { ENV } from '@/shared/config/env.js'

let stompClient = null

// STOMP 클라이언트 생성 + 연결
// JWT는 CONNECT 헤더의 Authorization으로 전달 (StompAuthInterceptor가 검증)
export function connectStomp(token, onConnectCallback) {
  if (stompClient && stompClient.active) {
    return stompClient
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(ENV.WS_URL),
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    reconnectDelay: 5000,
    onConnect: () => {
      if (onConnectCallback) onConnectCallback()
    },
    onStompError: (frame) => {
      console.error('[STOMP] error:', frame.headers['message'])
    }
  })

  stompClient.activate()
  return stompClient
}

// 연결 해제
export function disconnectStomp() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}

// 채팅방 구독
export function subscribeChatRoom(chatRoomId, onMessage) {
  if (!stompClient || !stompClient.active) return null
  return stompClient.subscribe(`/sub/chat/${chatRoomId}`, (message) => {
    onMessage(JSON.parse(message.body))
  })
}

// 본인 알림 구독
export function subscribeNotification(onNotification) {
  if (!stompClient || !stompClient.active) return null
  return stompClient.subscribe('/user/notification', (message) => {
    onNotification(JSON.parse(message.body))
  })
}

// 텍스트 메시지 전송
export function sendChatMessage(chatRoomId, content) {
  if (!stompClient || !stompClient.active) return
  stompClient.publish({
    destination: '/pub/chat/send',
    body: JSON.stringify({ chatRoomId, content })
  })
}

// 파일 메시지 전송
export function sendChatFile(chatRoomId, fileId) {
  if (!stompClient || !stompClient.active) return
  stompClient.publish({
    destination: '/pub/chat/file',
    body: JSON.stringify({ chatRoomId, fileId })
  })
}

export function getStompClient() {
  return stompClient
}