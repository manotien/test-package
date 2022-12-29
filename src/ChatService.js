"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.ChatService = void 0;
// This IChatService implementation is only an example and has no real business value.
// However, this is good start point to make your own implementation.
// Using this service it's possible to connects two or more chats in the same application for a demonstration purposes
var use_chat_1 = require("@chatscope/use-chat");
var socket_1 = require("./socket");
var randomId = function () { return Math.floor(Math.random() * Math.pow(10, 8)).toString(); };
var ChatService = /** @class */ (function () {
    function ChatService(storage, update) {
        var _this = this;
        this.eventHandlers = {
            onMessage: function () { },
            onConnectionStateChanged: function () { },
            onUserConnected: function () { },
            onUserDisconnected: function () { },
            onUserPresenceChanged: function () { },
            onUserTyping: function () { }
        };
        this.storage = storage;
        this.updateState = update;
        var isListened = socket_1.socket === null || socket_1.socket === void 0 ? void 0 : socket_1.socket.hasListeners("serverToClient");
        if (socket_1.socket && !isListened) {
            socket_1.socket.on("serverToClient", function (data) {
                var payload = {
                    message: {
                        id: randomId(),
                        status: use_chat_1.MessageStatus.DeliveredToCloud,
                        contentType: use_chat_1.MessageContentType.TextHtml,
                        senderId: data.customerId,
                        direction: use_chat_1.MessageDirection.Incoming,
                        content: data.message,
                        createdTime: new Date()
                    },
                    conversationId: data.conversationId,
                    customerId: data.customerId
                };
                // TODO: fix this.eventHandlers.onMessage function to callable
                // this.eventHandlers.onMessage(new MessageEvent(payload));
                _this.onMessage(payload);
                // notify(data.message);
            });
        }
    }
    // work around function to fix onMessage is not set properly when use with socket.on
    ChatService.prototype.onMessage = function (_a) {
        var _b;
        var message = _a.message, conversationId = _a.conversationId, customerId = _a.customerId;
        this.storage.addMessage(message, conversationId, false);
        var conversation = this.storage.getConversation(conversationId)[0];
        // Increment unread counter
        var activeConversation = this.storage.getState().activeConversation;
        if (conversation && (!activeConversation || activeConversation.id !== conversationId)) {
            this.storage.setUnread(conversationId, conversation.unreadCounter + 1);
        }
        // Update last message
        if (conversation) {
            var customer = this.storage.getUser(customerId)[0];
            conversation.data = __assign({ lastMessage: message.content, lastSenderName: customer.firstName }, conversation.data);
            (_b = this.storage) === null || _b === void 0 ? void 0 : _b.updateConversation(conversation);
        }
        // Reset typing
        if (conversation) {
            conversation.removeTypingUser(message.senderId);
        }
        this.updateState();
    };
    ChatService.prototype.sendMessage = function (data) {
        var _a;
        var conversationId = data.conversationId, message = data.message;
        var conversation = this.storage.getConversation(conversationId);
        var currentConversation = conversation[0];
        var user = this.storage.getState().currentUser;
        var agent_id = user === null || user === void 0 ? void 0 : user.id;
        var room_id = currentConversation.id;
        var customer = this.storage.getUser(currentConversation.participants[0].id)[0];
        socket_1.socket === null || socket_1.socket === void 0 ? void 0 : socket_1.socket.emit("clientToServer", { message: message.content, agent_id: agent_id, room_id: room_id, line_uid: customer.data.lineUid }, function (response) {
            console.log("server response:", response);
        });
        if (currentConversation) {
            var user_1 = this.storage.getState().currentUser;
            currentConversation.data = __assign({ lastMessage: message.content, lastSenderName: user_1.firstName }, currentConversation.data);
            (_a = this.storage) === null || _a === void 0 ? void 0 : _a.updateConversation(currentConversation);
        }
        return message;
    };
    ChatService.prototype.sendTyping = function () { };
    // The ChatProvider registers callbacks with the service.
    // These callbacks are necessary to notify the provider of the changes.
    // For example, when your service receives a message, you need to run an onMessage callback,
    // because the provider must know that the new message arrived.
    // Here you need to implement callback registration in your service.
    // You can do it in any way you like. It's important that you will have access to it elsewhere in the service.
    ChatService.prototype.on = function (evtType, evtHandler) {
        var key = "on".concat(evtType.charAt(0).toUpperCase()).concat(evtType.substring(1));
        if (key in this.eventHandlers) {
            this.eventHandlers[key] = evtHandler;
        }
    };
    // The ChatProvider can unregister the callback.
    // In this case remove it from your service to keep it clean.
    ChatService.prototype.off = function (evtType, eventHandler) {
        var key = "on".concat(evtType.charAt(0).toUpperCase()).concat(evtType.substring(1));
        if (key in this.eventHandlers) {
            this.eventHandlers[key] = function () { };
        }
    };
    return ChatService;
}());
exports.ChatService = ChatService;
