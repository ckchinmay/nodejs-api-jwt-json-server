const fs = require('fs');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const express = require('express');

const server = jsonServer.create();
const router = jsonServer.router('./database.json');
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));

server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789secret';

const expiresIn = '1h';

// Create a token from a payload 
function createToken(isAccessToken, payload) {
  var usrData = getUserData(payload);
  console.log(usrData);
  if (isAccessToken) {
    return jwt.sign(usrData, SECRET_KEY, { expiresIn });
  } else {
    return jwt.sign(usrData, SECRET_KEY, { expiresIn: '1d' });
  }
}

// Verify the token 
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err);
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1;
}

// Check if the user email exists in database
function isPresent({ email }) {
  return userdb.users.findIndex(user => user.email === email) !== -1;
}

// get user details
function getUserData({ email, password }) {
  let index = userdb.users.findIndex(user => user.email === email && user.password === password);
  return index !== -1 ? userdb.users[index] : null
}

// Register New User
server.post('/auth/register', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const { email, password, fname, lname } = req.body;

  if (isPresent({ email }) === true) {
    const status = 401;
    const message = 'Email already exist';
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      const status = 401;
      const message = err;
      res.status(status).json({ status, message });
      return;
    };

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length - 1].id;

    //Add new user
    data.users.push({ id: last_item_id + 1, fname, lname, email: email, password: password }); //add some data
    var writeData = fs.writeFile("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
      if (err) {
        const status = 401;
        const message = err;
        res.status(status).json({ status, message });
        return;
      }
      userdb.users.push({ id: last_item_id + 1, fname, lname, email: email, password: password });
      // Create token for new user
      const accessToken = createToken(true, { email, password });
      const refreshToken = createToken(false, { email, password });
      console.log("Access Token:" + accessToken);
      res.status(200).json({ accessToken, refreshToken });
    });
  });
})

// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const { email, password } = req.body;
  if (isAuthenticated({ email, password }) === false) {
    const status = 401;
    const message = 'Incorrect email or password';
    res.status(status).json({ status, message });
    return;
  }
  const accessToken = createToken(true, { email, password });
  const refreshToken = createToken(false, { email, password });
  console.log("Access Token:" + accessToken);
  res.status(200).json({ accessToken, refreshToken });
})


// Re-issue tokens
server.post('/auth/reissueToken', (req, res) => {
  console.log("reissueToken endpoint called; request body:");
  console.log(req.body);
  const { refreshToken } = req.body;
  jwt.verify(refreshToken, SECRET_KEY, function (err, decoded) {
    if (err) {
      const status = 401;
      const message = 'Error in authorization';
      res.status(status).json({ status, message });
      return;
    }
    const accessToken = createToken(true, decoded);
    const refreshToken = createToken(false, decoded);
    console.log("Access Token:" + accessToken);
    res.status(200).json({ accessToken, refreshToken });
  });

})

server.use(/^(?!\/auth).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401;
    const message = 'Error in authorization format';
    res.status(status).json({ status, message });
    return;
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401;
      const message = 'Access token not provided';
      res.status(status).json({ status, message });
      return;
    }
    next()
  } catch (err) {
    const status = 401;
    const message = 'Error access_token is revoked';
    res.status(status).json({ status, message });
  }
})

server.use(router);

server.listen(8000, () => {
  console.log('Running Auth API Server on localhost:8000');
})