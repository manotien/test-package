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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.ChatStorage = void 0;
var use_chat_1 = require("@chatscope/use-chat");
var MessageGroup_1 = require("@chatscope/use-chat/dist/MessageGroup");
var ChatStorage = /** @class */ (function () {
    /**
     * Constructor
     * @param messageIdGenerator
     * @param groupIdGenerator
     */
    function ChatStorage(_a) {
        var groupIdGenerator = _a.groupIdGenerator, messageIdGenerator = _a.messageIdGenerator;
        // TODO: Users by Id
        this.users = [];
        // TODO: Conversations By Id (Dedicated conversations collection)
        this.conversations = [];
        this.messages = {};
        this.currentMessage = "";
        this._groupIdGenerator = groupIdGenerator;
        this._messageIdGenerator = messageIdGenerator;
    }
    Object.defineProperty(ChatStorage.prototype, "groupIdGenerator", {
        get: function () {
            return this._groupIdGenerator;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChatStorage.prototype, "messageIdGenerator", {
        get: function () {
            return this._messageIdGenerator;
        },
        enumerable: false,
        configurable: true
    });
    ChatStorage.prototype.getMessageWithId = function (message, generateId) {
        if (generateId) {
            if (!this.messageIdGenerator) {
                throw "Id generator is not defined";
            }
            else {
                return __assign(__assign({}, message), { id: this.messageIdGenerator(message) });
            }
        }
        else {
            return message;
        }
    };
    /**
     * Check if user exists in users collection
     * @param userId
     */
    ChatStorage.prototype.userExists = function (userId) {
        return this.users.findIndex(function (u) { return u.id === userId; }) !== -1;
    };
    /**
     * Sets current (logged in) user object
     * @param user
     */
    ChatStorage.prototype.setCurrentUser = function (user) {
        this.currentUser = user;
    };
    /**
     * Add user to collection of users.
     * User will be added only when item with its id not exists in the collection.
     * @param user
     */
    ChatStorage.prototype.addUser = function (user) {
        var notExists = !this.userExists(user.id);
        if (notExists) {
            this.users = this.users.concat(user);
        }
        return notExists;
    };
    /**
     * Remove user from users collection.
     * If the participant existed and has been removed, it returns true, otherwise it returns false
     * @param userId
     */
    ChatStorage.prototype.removeUser = function (userId) {
        var idx = this.users.findIndex(function (u) { return u.id === userId; });
        if (idx !== -1) {
            this.users = this.users.slice(0, idx).concat(this.users.slice(idx + 1));
            return true;
        }
        return false;
    };
    /**
     * Get user by id
     * @param userId
     * @return [User, number]|[undefined,undefined]
     */
    ChatStorage.prototype.getUser = function (userId) {
        var idx = this.users.findIndex(function (u) { return u.id === userId; });
        if (idx !== -1) {
            return [this.users[idx], idx];
        }
        return [undefined, undefined];
    };
    /**
     * Checks if conversation exists
     * @param conversationId
     */
    ChatStorage.prototype.conversationExists = function (conversationId) {
        return this.conversations.findIndex(function (c) { return c.id === conversationId; }) !== -1;
    };
    /**
     * Get conversation
     * @param conversationId
     * @return [Conversation, number]|[undefined, undefined]
     */
    ChatStorage.prototype.getConversation = function (conversationId) {
        var idx = this.conversations.findIndex(function (c) { return c.id === conversationId; });
        if (idx !== -1) {
            return [this.conversations[idx], idx];
        }
        return [undefined, undefined];
    };
    /**
     * Add conversation to collection of conversations.
     * Conversation will be added only when item with its id not exists in the collection.
     * @param conversation
     */
    ChatStorage.prototype.addConversation = function (conversation) {
        var notExists = !this.conversationExists(conversation.id);
        if (notExists) {
            this.conversations = this.conversations.concat(conversation);
        }
        return notExists;
    };
    /**
     * Set unread messages for conversation
     * @param conversationId
     * @param count
     */
    ChatStorage.prototype.setUnread = function (conversationId, count) {
        var conversation = this.getConversation(conversationId)[0];
        if (conversation) {
            conversation.unreadCounter = count;
        }
    };
    /**
     * Remove conversation from conversations collection.
     * If the conversation existed and has been removed, it returns true, otherwise it returns false
     * @param conversationId
     * @param removeMessages
     */
    ChatStorage.prototype.removeConversation = function (conversationId, removeMessages) {
        if (removeMessages === void 0) { removeMessages = true; }
        var idx = this.conversations.findIndex(function (c) { return c.id === conversationId; });
        if (idx !== -1) {
            this.conversations = this.conversations.slice(0, idx).concat(this.conversations.slice(idx + 1));
            if (removeMessages) {
                delete this.messages[conversationId];
            }
            return true;
        }
        return false;
    };
    /**
     * Replace the conversation in the collection with the new one specified in the parameter
     * @param conversation
     */
    ChatStorage.prototype.updateConversation = function (conversation) {
        var _a = this.getConversation(conversation.id), con = _a[0], idx = _a[1];
        if (con) {
            this.replaceConversation(conversation, idx);
        }
    };
    ChatStorage.prototype.replaceConversation = function (conversation, idx) {
        this.conversations = this.conversations
            .slice(0, idx)
            .concat(new use_chat_1.Conversation({
            id: conversation.id,
            participants: conversation.participants,
            typingUsers: conversation.typingUsers,
            unreadCounter: conversation.unreadCounter,
            draft: conversation.draft,
            description: conversation.description,
            readonly: conversation.readonly,
            data: conversation.data
        }))
            .concat(this.conversations.slice(idx + 1));
    };
    ChatStorage.prototype.replaceUser = function (user, idx) {
        this.users = this.users
            .slice(0, idx)
            .concat(user)
            .concat(this.users.slice(idx + 1));
    };
    /**
     * Add participant to the conversation only if not already added and conversation exists.
     * Returns true if participant has been added, otherwise returns false.
     * @param conversationId
     * @param participant
     * @return boolean
     */
    ChatStorage.prototype.addParticipant = function (conversationId, participant) {
        var _a = this.getConversation(conversationId), conversation = _a[0], idx = _a[1];
        if (conversation) {
            if (conversation.addParticipant(participant)) {
                this.replaceConversation(conversation, idx);
            }
        }
        return false;
    };
    /**
     * Remove participant from conversation.
     * If the participant existed and has been removed, it returns true, otherwise it returns false
     * @param conversationId
     * @param participantId
     */
    ChatStorage.prototype.removeParticipant = function (conversationId, participantId) {
        var _a = this.getConversation(conversationId), conversation = _a[0], idx = _a[1];
        if (conversation) {
            conversation.removeParticipant(participantId);
            this.replaceConversation(conversation, idx);
            return true;
        }
        return false;
    };
    ChatStorage.prototype.addMessage = function (message, conversationId, generateId, addToTop) {
        if (generateId === void 0) { generateId = false; }
        if (addToTop === void 0) { addToTop = false; }
        if (addToTop) {
            return this.addMessageToTop(message, conversationId, generateId);
        }
        else {
            return this.addMessageToBottom(message, conversationId, generateId);
        }
    };
    ChatStorage.prototype.addMessageToTop = function (message, conversationId, generateId) {
        if (generateId === void 0) { generateId = false; }
        if (conversationId in this.messages) {
            var groups = this.messages[conversationId];
            var firstGroup = groups[0];
            if (firstGroup.senderId === message.senderId) {
                // Add message to group
                var newMessage_1 = this.getMessageWithId(message, generateId);
                firstGroup.messages.unshift(newMessage_1);
                return newMessage_1;
            }
        }
        var group = new MessageGroup_1.MessageGroup({
            id: this.groupIdGenerator(),
            senderId: message.senderId,
            direction: message.direction
        });
        var newMessage = this.getMessageWithId(message, generateId);
        group.messages.unshift(newMessage);
        this.messages[conversationId] =
            conversationId in this.messages ? __spreadArray([group], this.messages[conversationId], true) : [group];
        return newMessage;
    };
    ChatStorage.prototype.addMessageToBottom = function (message, conversationId, generateId) {
        if (generateId === void 0) { generateId = false; }
        if (conversationId in this.messages) {
            var groups = this.messages[conversationId];
            var lastGroup = groups[groups.length - 1];
            if (lastGroup.senderId === message.senderId) {
                // Add message to group
                var newMessage_2 = this.getMessageWithId(message, generateId);
                lastGroup.addMessage(newMessage_2);
                return newMessage_2;
            }
        }
        var group = new MessageGroup_1.MessageGroup({
            id: this.groupIdGenerator(),
            senderId: message.senderId,
            direction: message.direction
        });
        var newMessage = this.getMessageWithId(message, generateId);
        group.addMessage(newMessage);
        this.messages[conversationId] =
            conversationId in this.messages ? this.messages[conversationId].concat(group) : [group];
        return newMessage;
    };
    // TODO: Refactoring - it's not very optimal :)
    /**
     * Update message
     * @param message
     */
    ChatStorage.prototype.updateMessage = function (message) {
        for (var conversationId in this.messages) {
            var groups = this.messages[conversationId];
            var l = groups.length;
            for (var i = 0; i < l; i++) {
                var group = groups[i];
                var _a = group.getMessage(message.id), currentMessage = _a[0], idx = _a[1];
                if (currentMessage) {
                    group.replaceMessage(message, idx);
                }
            }
        }
    };
    /**
     * Set user presence
     * @param userId
     * @param presence
     */
    ChatStorage.prototype.setPresence = function (userId, presence) {
        var _a = this.getUser(userId), user = _a[0], idx = _a[1];
        if (user) {
            user.presence = presence;
            this.replaceUser(user, idx);
        }
    };
    /**
     * Set draft of message in current conversation
     * @param {String} draft
     */
    ChatStorage.prototype.setDraft = function (draft) {
        if (this.activeConversationId) {
            var _a = this.getConversation(this.activeConversationId), activeConversation = _a[0], idx = _a[1];
            if (activeConversation) {
                activeConversation.draft = draft;
                this.replaceConversation(activeConversation, idx);
            }
        }
    };
    ChatStorage.prototype.clearState = function () { };
    ChatStorage.prototype.getState = function () {
        var _this = this;
        return {
            currentUser: this.currentUser,
            users: this.users,
            conversations: this.conversations,
            // TODO: Implement sth like collection referencing by id (map with guaranteed order like in immutablejs) because searching every time in the array does not make sense
            activeConversation: this.activeConversationId
                ? this.conversations.find(function (c) { return c.id === _this.activeConversationId; })
                : undefined,
            currentMessages: this.activeConversationId && this.activeConversationId in this.messages
                ? this.messages[this.activeConversationId]
                : [],
            messages: this.messages,
            currentMessage: this.currentMessage
        };
    };
    ChatStorage.prototype.resetState = function () {
        this.currentUser = undefined;
        this.users = [];
        this.conversations = [];
        this.activeConversationId = undefined;
        this.messages = {};
    };
    /**
     * Set active conversation and reset unread counter of this conversation if second parameter is set.
     * Why active conversation is kept here in storage?
     * Because it's easy to persist whole storage and recreate from persistent state.
     * @param conversationId
     * @param resetUnreadCounter
     */
    ChatStorage.prototype.setActiveConversation = function (conversationId, resetUnreadCounter) {
        if (resetUnreadCounter === void 0) { resetUnreadCounter = true; }
        this.activeConversationId = conversationId;
        if (resetUnreadCounter && conversationId) {
            var _a = this.getConversation(conversationId), conversation = _a[0], idx = _a[1];
            if (conversation) {
                conversation.unreadCounter = 0;
                this.replaceConversation(conversation, idx);
            }
        }
    };
    /**
     * Set current  message input value
     * @param message
     */
    ChatStorage.prototype.setCurrentMessage = function (message) {
        this.currentMessage = message;
    };
    /**
     * Remove all the messages from the conversation
     * @param conversationId
     */
    ChatStorage.prototype.removeMessagesFromConversation = function (conversationId) {
        delete this.messages[conversationId];
    };
    return ChatStorage;
}());
exports.ChatStorage = ChatStorage;
