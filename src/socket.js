"use strict";
exports.__esModule = true;
exports.initializeSocket = exports.isReady = exports.socket = void 0;
var socket_io_client_1 = require("socket.io-client");
exports.isReady = false;
var initializeSocket = function () {
    exports.socket = (0, socket_io_client_1.connect)("http://localhost:4002", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
    });
    return exports.socket;
};
exports.initializeSocket = initializeSocket;
