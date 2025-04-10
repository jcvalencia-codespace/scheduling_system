import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new PusherServer({
  appId: "1866925",
  key: "0821587d632a1efdfaa7",
  secret: "212d9029304342fa30b9",
  cluster: "ap1",
  useTLS: true,
});

export const pusherClient = new PusherClient("0821587d632a1efdfaa7", {
  cluster: "ap1",
  forceTLS: true,
  enabledTransports: ['ws', 'wss']
});