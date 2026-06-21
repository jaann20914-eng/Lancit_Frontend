// ============================================================
// STOMP 구독/발행 경로 상수
// ============================================================

export const STOMP_SEND = {
  // 텍스트 메시지 전송
  SEND_TEXT: '/pub/chat/send',
  // 파일 메시지 전송
  SEND_FILE: '/pub/chat/file',
}

export const STOMP_SUBSCRIBE = {
  // 특정 채팅방 구독 (chatRoomId 동적 삽입)
  chatRoom: (chatRoomId) => `/sub/chat/${chatRoomId}`,
  // 본인 알림 구독 (Principal 기반)
  notification: '/user/notification',
}