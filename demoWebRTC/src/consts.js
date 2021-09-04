export const WS_URL = 'https://779c-125-212-157-166.ngrok.io/';
export const SocketEvent = {
  connect: 'connect',
  exchange: 'exchange',
  leave: 'leave',
  join: 'join',
};
export const configurationICE = {
  iceServers: [
    {urls: 'stun:stun.l.google.com:19302?transport=tcp'},
    {urls: 'stun:stun.l.google.com:19302?transport=udp'},
    {
      urls: ['turn:trustkeys.network:3478?transport=udp'],
      username: 'trustkeys',
      credential: '123456',
    },
  ],
};
