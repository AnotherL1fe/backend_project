export type ChatMessageKind = 'user' | 'system' | 'message'

export type ChatRoomName = string
export type ChatNickname = string

export interface ChatMessage {
  kind: ChatMessageKind
  id: string
  room: ChatRoomName
  author: ChatNickname
  text: string
  createdAt: number
}

export interface ChatJoinPayload {
  room: ChatRoomName
  nickname: ChatNickname
}

export interface ChatJoinAckOk {
  ok: true
}

export interface ChatJoinAckError {
  ok: false
  error: string
}

export type ChatJoinAck = ChatJoinAckOk | ChatJoinAckError

export interface ChatSendPayload {
  room: ChatRoomName
  text: string
}

export interface ChatSendAckOk {
  ok: true
}

export interface ChatSendAckError {
  ok: false
  error: string
}

export type ChatSendAck = ChatSendAckOk | ChatSendAckError

export interface Message {
  id: number;
  text: string;
  author: string;
  authorId: number;
  createdAt: string;
  kind?: 'message' | 'system';
}

export interface TicketInfo {
  id: number;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  priority: 'low' | 'medium' | 'high';
  description?: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    email: string;
  };
}