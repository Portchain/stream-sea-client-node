"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const stream_sea_connection_1 = require("./stream-sea-connection");
const logger = require('logacious')();
const RECONNECT_INTERVAL_MS = 3000;
const getWsURLScheme = (secure) => (secure ? 'wss' : 'ws');
/**
 * Events:
 *   error
 *
 * Public methods:
 *   addSubscription: (subscription: IStreamSeaSubscription) => void
 */
class StreamSeaClient extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.subscriptions = [];
        this.onConnectionClose = () => {
            logger.warn('StreamSeaClient: Connection closed');
            setTimeout(this.reopenConnection, RECONNECT_INTERVAL_MS);
        };
        this.reopenConnection = () => {
            logger.warn('StreamSeaClient: Reopening connection');
            this.connection = this.options.connectionFactory.createConnection({
                url: `${getWsURLScheme(this.options.secure)}://${this.options.remoteServerHost}:${this.options.remoteServerPort}/api/v1/streams`,
                appId: this.options.appId,
                appSecret: this.options.appSecret,
            });
            this.connection.on('close', this.onConnectionClose);
            this.connection.on('error', e => console.error(e));
            // TODO: avoid code repetition
            this.subscriptions.forEach(subscription => this.connection.addSubscription(subscription));
        };
        this.addSubscription = (subscription) => {
            this.subscriptions.push(subscription);
            this.connection.addSubscription(subscription);
        };
        this.options = options;
        this.connection = options.connectionFactory.createConnection({
            url: `${getWsURLScheme(options.secure)}://${options.remoteServerHost}:${options.remoteServerPort}/api/v1/streams`,
            appId: options.appId,
            appSecret: options.appSecret,
        });
        this.connection.on('close', this.onConnectionClose);
        this.connection.on('error', e => console.error(e));
    }
}
exports.StreamSeaClient = StreamSeaClient;
exports.getStreamSeaClient = (options) => new StreamSeaClient({ ...options, connectionFactory: new stream_sea_connection_1.StreamSeaConnectionFactory({}) });
