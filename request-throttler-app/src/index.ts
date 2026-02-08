import express from "express";

const app = express();
app.use(express.json());

const requestTracker = new Map();

const rateLimit = (limit: Number, windowMs: any) => {
  return (req: { ip: any }, res: any, next: any) => {
    const { ip } = req;
    const now = Date.now();

    if (!requestTracker.has(ip)) {
      requestTracker.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const tracker = requestTracker.get(ip);

    if (now > tracker.resetTime) {
      tracker.count = 1;
      tracker.resetTime = now + windowMs;
      return next();
    }

    if (tracker.count >= limit) {
      return res.status(429).json({
        status: 429,
        error: "Too many requests",
        message: "You have exceeded the rate limit. Please try again later.",
      });
    }

    tracker.count++;
    next();
  };
};

app.use(rateLimit(10, 60000));

app.get("/", (_, res) => {
  const str = "Hello World!";
  console.log(str);

  res.send(str);
});

app.get("/health", (_, res) => res.send("ok"));

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});
