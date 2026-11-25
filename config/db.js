const mongoose = require("mongoose");

// Cache the connection so Vercel serverless functions reuse it between requests
const cache = global._mongoose || (global._mongoose = { conn: null, promise: null });

module.exports = async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(process.env.MONGO_URI);
  cache.conn = await cache.promise;
  return cache.conn;
};
