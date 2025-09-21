import express from "express";
import session from "express-session";
import { Issuer, generators } from "openid-client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

// Session config
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Discover Cognito issuer
const issuer = await Issuer.discover(
  `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USERPOOL_ID}`
);

const client = new issuer.Client({
  client_id: process.env.COGNITO_CLIENT_ID,
  client_secret: process.env.COGNITO_CLIENT_SECRET,
  redirect_uris: [process.env.REDIRECT_URI],
  response_types: ["code"],
});

// Middleware to check auth
function checkAuth(req, res, next) {
  if (!req.session.userInfo) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Login
app.get("/login", (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
    scope: "openid profile email",
    response_mode: "query",
    nonce,
    state,
  });

  res.redirect(authUrl);
});

// Callback
app.get("/callback", async (req, res) => {
  try {
    const params = client.callbackParams(req);

    const tokenSet = await client.callback(
      process.env.REDIRECT_URI,
      params,
      {
        nonce: req.session.nonce,
        state: req.session.state,
      }
    );

    const userInfo = await client.userinfo(tokenSet.access_token);
    req.session.userInfo = userInfo;

    res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error("Callback error:", err);
    res.redirect(process.env.FRONTEND_URL);
  }
});

// User info
app.get("/me", checkAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.session.userInfo,
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    const logoutUrl = `https://${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=${process.env.FRONTEND_URL}`;
    res.redirect(logoutUrl);
  });
});

app.listen(port, () => {
  console.log(`✅ Backend running at http://localhost:${port}`);
});
