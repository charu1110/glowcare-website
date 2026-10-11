// api/hello.js — Step 1: proves the pipeline works. No input, no database.
export default function handler(req, res) {
  res.status(200).json({
    message: "Hello from your first API!",
    time: new Date().toISOString()
  });
}
