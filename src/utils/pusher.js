import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new PusherServer({
  appId: "1987371",
  key: "74f2d50d18d447032f41",
  secret: "b563eaf3580b3d3eb012",
  cluster: "ap1",
  useTLS: true,
});

export const pusherClient = new PusherClient("74f2d50d18d447032f41", {
  cluster: "ap1",
  forceTLS: true,
  enabledTransports: ['ws', 'wss']
});