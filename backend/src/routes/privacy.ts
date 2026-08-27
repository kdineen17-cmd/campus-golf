import { Router } from "express";

export const privacyRouter = Router();

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Home Course — Privacy Policy</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 20px 80px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 32px; }
  .updated { color: #666; font-size: 14px; margin-bottom: 32px; }
  ul { padding-left: 20px; }
</style>
</head>
<body>
<h1>Home Course Privacy Policy</h1>
<p class="updated">Last updated August 27, 2026</p>

<p>Home Course ("we", "us") is a mobile app for designing and playing disc/frisbee golf courses. This page explains what information we collect, how it's used, and how you can delete it.</p>

<h2>Information we collect</h2>
<ul>
  <li><strong>Account information:</strong> your username, email address, and a securely hashed password. We never store your password in plain text.</li>
  <li><strong>Location data:</strong> when you design a course, we record the GPS coordinates you mark for each tee and hole. When you play a course, we use your device location to show your position on the course map. Location data is only collected while you're actively using those features.</li>
  <li><strong>Photos:</strong> if you choose to add a tee-box photo to a hole, that photo (and the flag position you mark on it) is stored with the hole.</li>
  <li><strong>Gameplay data:</strong> the courses you create and the rounds you play, including strokes per hole and completion time, so we can show your round history and course leaderboards.</li>
</ul>

<h2>How we use this information</h2>
<p>Everything we collect is used solely to provide the app's core functionality: letting you build courses, play them, and track your results. We do not use your data for advertising, and we do not run analytics or tracking SDKs.</p>

<h2>Sharing</h2>
<p>We do not sell or share your personal information with third parties. Course names, hole layouts, and leaderboard entries (username and score only) are visible to other users of the app, since that's how shared courses and leaderboards work.</p>

<h2>Data retention and deletion</h2>
<p>Your data is retained as long as your account exists. You can permanently delete your account at any time from within the app: go to <strong>Profile → Delete my account</strong>. This immediately and permanently deletes your account, every course you created, and your round history. This action cannot be undone.</p>

<h2>Contact</h2>
<p>Questions about this policy or your data can be sent to <a href="mailto:triangleshirtllc@gmail.com">triangleshirtllc@gmail.com</a>.</p>
</body>
</html>
`;

privacyRouter.get("/", (_req, res) => {
  res.type("html").send(PRIVACY_HTML);
});
