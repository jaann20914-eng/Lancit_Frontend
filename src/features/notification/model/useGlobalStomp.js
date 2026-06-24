import { Client } from '@stomp/stompjs'
import { useNotificationStore } from '@/features/notification/model/useNotificationStore.js'

let stompClient = null
const connectCallbacks = []

export function useGlobalStomp() {
  function connect(email) {
    if (stompClient?.connected) return

    const token = localStorage.getItem('accessToken')
    if (!token || !email) return

    const notificationStore = useNotificationStore()

    stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-native',
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        // 알림 구독
        stompClient.subscribe(`/user/${email}/notification`, (frame) => {
          const notification = JSON.parse(frame.body)
          notificationStore.addNotification(notification)
        })

        // 연결 완료 후 대기 중인 콜백 실행 (채팅 구독 등)
        connectCallbacks.forEach((cb) => cb(stompClient))
        connectCallbacks.length = 0
      },
      onStompError: (frame) => {
        console.error('STOMP 에러', frame)
      },
      onDisconnect: () => {
        connectCallbacks.length = 0
      },
    })

    stompClient.activate()
  }

  function disconnect() {
    if (stompClient) {
      stompClient.deactivate()
      stompClient = null
    }
  }

  // 연결 완료 후 실행할 콜백 등록
  // 이미 연결되어 있으면 즉시 실행
  function onConnected(callback) {
    if (stompClient?.connected) {
      callback(stompClient)
    } else {
      connectCallbacks.push(callback)
    }
  }

  function getClient() {
    return stompClient
  }

  function isConnected() {
    return stompClient?.connected ?? false
  }

  return { connect, disconnect, onConnected, getClient, isConnected }
}
