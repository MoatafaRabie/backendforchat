const sseClients = {}; // userId -> res

const registerClient = (userId, res) => {
  sseClients[userId] = res;
};

const unregisterClient = (userId) => {
  delete sseClients[userId];
};

const sendSSE = (to, event, data) => {
  const res = sseClients[to];
  if (!res) return false;
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = { registerClient, unregisterClient, sendSSE };
