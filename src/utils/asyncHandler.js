// Express 4 doesn't automatically catch errors thrown inside async route
// handlers. If one throws (e.g. a database hiccup), it becomes an unhandled
// promise rejection — which, on modern Node, crashes the entire process
// instead of just failing that one request. That single crashed request then
// shows up to the browser as a CORS error, because the crashed process never
// sent back any response (including CORS headers) at all.
//
// Wrapping every async route in this fixes that: real errors still get a
// proper JSON error response, but the server itself stays up.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
