import io from 'socket.io-client';
import serviceWebRTC from './serviceWebRTC';
import {SocketEvent} from '../consts';

class ServiceWS {
  constructor() {
    this._listeners = [];
    this._socket = false;
  }
  connect = (wsUrl = '') => {
    const socket = io(wsUrl);
    console.log('connect: ', wsUrl);
    socket.on('error', () => {
      console.log('error');
    });
    socket.on(SocketEvent.connect, () => {
      console.log('connected');
      this._notifyListeners({connected: true});
    });
    socket.on(SocketEvent.exchange, data => {
      console.log('data');
      serviceWebRTC.exchange(data);
    });
    socket.on(SocketEvent.leave, socketId => {
      console.log('leave: ', socketId);
      serviceWebRTC.leave(socketId);
    });
    serviceWebRTC.InitWSIfNeed(this._initWSIfNeed);
    this._socket = socket;
  };
  _initWSIfNeed = (type, msg, cb = false) => {
    if (!this._socket) {
      return;
    }
    this._socket.emit(type, msg, cb);
    console.log('sent: ', type, msg);
  };
  disconnect = () => {
    if (this._socket) {
      this._socket.disconnect();
    }
  };
  send = (type, msg) => {
    console.log('send: ', type, msg, this._socket);
    if (this._socket) {
      this._socket.emit(type, msg);
      console.log('sent: ', type, msg);
    }
  };
  addListener = listener => {
    if (!listener || typeof listener !== 'function') {
      return;
    }
    if (this._listeners.indexOf(listener) < 0) {
      this._listeners.push(listener);
    }
  };

  removeListener = listener => {
    if (!listener || typeof listener !== 'function') {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index >= 0) {
      this._listeners.splice(index, 1);
    }
  };
  _notifyListeners = data => {
    for (const listener of this._listeners) {
      listener(data);
    }
  };
}

const serviceWS = new ServiceWS();
export default serviceWS;
