// This IChatService implementation is only an example and has no real business value.
// However, this is good start point to make your own implementation.
// Using this service it's possible to connects two or more chats in the same application for a demonstration purposes
import {
  ChatEvent,
  IStorage,
  IChatService,
  ChatEventType,
  MessageContentType,
  MessageDirection,
  ChatEventHandler,
  SendMessageServiceParams,
  UpdateState,
  MessageStatus,
  ChatMessage,
} from "@chatscope/use-chat";
import { socket } from "./socket";

const randomId = () => Math.floor(Math.random() * 10 ** 8).toString();

type EventHandlers = {
  onMessage: ChatEventHandler<ChatEventType.Message, ChatEvent<ChatEventType.Message>>;
  onConnectionStateChanged: ChatEventHandler<
    ChatEventType.ConnectionStateChanged,
    ChatEvent<ChatEventType.ConnectionStateChanged>
  >;
  onUserConnected: ChatEventHandler<ChatEventType.UserConnected, ChatEvent<ChatEventType.UserConnected>>;
  onUserDisconnected: ChatEventHandler<ChatEventType.UserDisconnected, ChatEvent<ChatEventType.UserDisconnected>>;
  onUserPresenceChanged: ChatEventHandler<
    ChatEventType.UserPresenceChanged,
    ChatEvent<ChatEventType.UserPresenceChanged>
  >;
  onUserTyping: ChatEventHandler<ChatEventType.UserTyping, ChatEvent<ChatEventType.UserTyping>>;
  [key: string]: any;
};
export class ChatService implements IChatService {
  storage?: IStorage;
  updateState: UpdateState;

  eventHandlers: EventHandlers = {
    onMessage: () => {},
    onConnectionStateChanged: () => {},
    onUserConnected: () => {},
    onUserDisconnected: () => {},
    onUserPresenceChanged: () => {},
    onUserTyping: () => {},
  };

  constructor(storage: IStorage, update: UpdateState) {
    this.storage = storage;
    this.updateState = update;

    const isListened = socket?.hasListeners("serverToClient");
    if (socket && !isListened) {
      socket.on("serverToClient", (data: any) => {
        const payload = {
          message: {
            id: randomId(),
            status: MessageStatus.DeliveredToCloud,
            contentType: MessageContentType.TextHtml,
            senderId: data.customerId,
            direction: MessageDirection.Incoming,
            content: data.message,
            createdTime: new Date(),
          },
          conversationId: data.conversationId,
          customerId: data.customerId,
        };

        // TODO: fix this.eventHandlers.onMessage function to callable
        // this.eventHandlers.onMessage(new MessageEvent(payload));

        this.onMessage(payload);
        // notify(data.message);
      });
    }
  }

  // work around function to fix onMessage is not set properly when use with socket.on
  onMessage({
    message,
    conversationId,
    customerId,
  }: {
    message: ChatMessage<MessageContentType>;
    conversationId: string;
    customerId: string;
  }) {
    this.storage!.addMessage(message, conversationId, false);
    const [conversation] = this.storage!.getConversation(conversationId);
    // Increment unread counter
    const { activeConversation } = this.storage!.getState();
    if (conversation && (!activeConversation || activeConversation.id !== conversationId)) {
      this.storage!.setUnread(conversationId, conversation.unreadCounter + 1);
    }
    // Update last message
    if (conversation) {
      const customer = this.storage!.getUser(customerId)[0]!;
      conversation.data = {
        ...conversation.data,
        lastMessage: message.content,
        lastSenderName: customer.firstName,
      };
      this.storage?.updateConversation(conversation);
    }
    // Reset typing
    if (conversation) {
      conversation.removeTypingUser(message.senderId);
    }
    this.updateState();
  }

  sendMessage(data: SendMessageServiceParams) {
    const { conversationId, message } = data;
    const conversation = this.storage!.getConversation(conversationId);
    const currentConversation = conversation[0]!;
    const user = this.storage!.getState().currentUser;
    const agent_id = user?.id;
    const room_id = currentConversation.id;
    const customer = this.storage!.getUser(currentConversation.participants[0]!.id)[0]!;

    socket?.emit(
      "clientToServer",
      { message: message.content, agent_id, room_id, line_uid: customer.data.lineUid },
      (response: any) => {
        console.log("server response:", response);
      }
    );

    if (currentConversation) {
      const user = this.storage!.getState().currentUser;
      currentConversation.data = {
        ...currentConversation.data,
        lastMessage: message.content,
        lastSenderName: user!.firstName,
      };
      this.storage?.updateConversation(currentConversation);
    }
    return message;
  }

  sendTyping() {}

  // The ChatProvider registers callbacks with the service.
  // These callbacks are necessary to notify the provider of the changes.
  // For example, when your service receives a message, you need to run an onMessage callback,
  // because the provider must know that the new message arrived.
  // Here you need to implement callback registration in your service.
  // You can do it in any way you like. It's important that you will have access to it elsewhere in the service.
  on<T extends ChatEventType, H extends ChatEvent<T>>(evtType: T, evtHandler: ChatEventHandler<T, H>) {
    const key = `on${evtType.charAt(0).toUpperCase()}${evtType.substring(1)}`;
    if (key in this.eventHandlers) {
      (this.eventHandlers as any)[key] = evtHandler;
    }
  }

  // The ChatProvider can unregister the callback.
  // In this case remove it from your service to keep it clean.
  off<T extends ChatEventType, H extends ChatEvent<T>>(evtType: T, eventHandler: ChatEventHandler<T, H>) {
    const key = `on${evtType.charAt(0).toUpperCase()}${evtType.substring(1)}`;
    if (key in this.eventHandlers) {
      (this.eventHandlers as any)[key] = () => {};
    }
  }
}
