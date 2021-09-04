import {isFunction} from 'lodash';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';
import {configurationICE, SocketEvent} from '../consts';

class ServiceWebRTC {
  _listeners = [];
  /**RTCPeerConnection */
  pcPeers = {};
  remoteList = {};
  appClass;
  localStream;
  sendMethod = false;
  roomID;

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
  /**
   * notify listeners
   *
   * @param {*} data
   */
  _notifyListeners = data => {
    for (const listener of this._listeners) {
      listener(data);
    }
  };
  /**WS*/
  InitWSIfNeed = send => {
    if (isFunction(send)) {
      this.sendMethod = send;
    }
  };
  /**LocalStream*/
  startLocalStream = async isFront => {
    try {
      const devices = await mediaDevices.enumerateDevices();
      if (devices) {
        const facing = isFront ? 'front' : 'environment';
        const videoSourceId = devices.find(
          device => device.kind === 'videoinput' && device.facing === facing,
        );
        const facingMode = isFront ? 'user' : 'environment';
        const constraints = {
          audio: true,
          video: {
            mandatory: {
              minWidth: 500, // Provide your own width, height and frame rate here
              minHeight: 300,
              minFrameRate: 30,
            },
            facingMode,
            optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
          },
        };
        const newStream = await mediaDevices.getUserMedia(constraints);
        /**refresh localstream */
        if (newStream) {
          this.setLocalStream(newStream);
          return newStream;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  };
  setLocalStream(newStream) {
    if (newStream) {
      this.localStream = newStream;
      let data = {
        isLocalStream: true,
        localStream: newStream,
      };
      this._notifyListeners(data);
    }
  }
  createPC = (socketId, isOffer) => {
    /**
     * Create the Peer Connection
     */
    console.log('createPC: ', socketId);
    const peer = new RTCPeerConnection(configurationICE);

    this.pcPeers = {
      ...this.pcPeers,
      [socketId]: peer,
    };
    console.log('createPC: ', peer);

    /**
     * (Deprecated)
     */
    if (this.localStream) {
      peer.addStream(this.localStream);
    }
    /**
     * On Negotiation Needed
     */
    peer.onnegotiationneeded = async () => {
      console.log('onnegotiationneeded');
      if (isOffer) {
        await this.createOffer(socketId);
      }
    };

    /**
     * On Ice Candidate
     */
    peer.onicecandidate = event => {
      if (event.candidate) {
        let jsonDataSend = {
          to: socketId,
          candidate: event.candidate,
        };
        this.sendMethod(SocketEvent.exchange, jsonDataSend);
      }
    };

    /**
     * On Ice Connection State Change
     */
    peer.oniceconnectionstatechange = event => {
      if (event.target.iceConnectionState === 'connected') {
        let tmp = {};
        tmp.connected = true;
        this._notifyListeners(tmp);
      }
    };

    /**
     * On Signaling State Change
     */
    peer.onsignalingstatechange = event => {
      //console.log('on signaling state change', event.target.signalingState);
    };

    /**
     * On Add Stream (Deprecated)
     */
    peer.onaddstream = event => {
      this.remoteList[socketId] = event.stream.toURL();
      this.changedStatusWebRTC();
    };

    /**
     * On Remove Stream
     */
    peer.onremovestream = event => {
      //console.log('on remove stream', event.stream);
    };

    return peer;
  };
  createOffer = async socketId => {
    console.log('createOffer: ', socketId);
    if (this.pcPeers[socketId]) {
      let peer = this.pcPeers[socketId];
      const offer = await peer.createOffer();
      if (offer) {
        await peer.setLocalDescription(offer);
        /**send sdp: pc.localDescription */
        if (this.sendMethod) {
          let jsonDataSend = {
            to: socketId,
            sdp: peer.localDescription,
          };
          this.sendMethod(SocketEvent.exchange, jsonDataSend);
        }
      }
    }
  };
  exchange = async data => {
    let fromId = data.from;
    let peer;
    if (fromId in this.pcPeers) {
      peer = this.pcPeers[fromId];
    } else {
      peer = this.createPC(fromId, false);
    }

    if (data.sdp) {
      let remoteOffer = data.sdp;
      await peer.setRemoteDescription(remoteOffer);
      if (peer.remoteDescription.type === 'offer') {
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        if (this.sendMethod) {
          let jsonDataSend = {
            to: fromId,
            sdp: peer.localDescription,
          };
          this.sendMethod(SocketEvent.exchange, jsonDataSend);
        }
      }
    } else {
      peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };
  join = roomID => {
    let onJoin = socketIds => {
      console.log('socketIds: ', socketIds);
      this.roomID = roomID;
      for (let index = 0; index < socketIds.length; index++) {
        const socketId = socketIds[index];
        console.log('socketId: ', socketId);
        this.createPC(socketId, true);
      }
    };
    this.sendMethod(SocketEvent.join, roomID, onJoin);
  };
  leave = socketId => {
    const peer = this.pcPeers[socketId];
    if (!peer) {
      return;
    }
    peer.close();
    delete this.pcPeers[socketId];
    delete this.remoteList[socketId];
    this.changedStatusWebRTC();
  };

  mapHash = (hash, func) => {
    const array = [];
    for (const key in hash) {
      if (hash.hasOwnProperty(key)) {
        const obj = hash[key];
        array.push(func(obj, key));
      }
    }
    return array;
  };
  changedStatusWebRTC() {
    // this.hub.emit(WebRTCEvent.STATUS_CHANGED);
    let tmp = {};
    tmp.isStatusChanged = true;
    this._notifyListeners(tmp);
  }
}

const serviceRTC = new ServiceWebRTC();
export default serviceRTC;
