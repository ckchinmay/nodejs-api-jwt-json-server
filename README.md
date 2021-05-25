# NodeJS + JSON-server + JWT

A Fake REST API using json-server with JWT authentication. 

Implemented End-points: login,register,reissue

## Install

$ npm install
$ npm run start-auth
```

## How to login/register?

You can login/register by sending a POST request to

```
POST http://localhost:8000/auth/login
POST http://localhost:8000/auth/register
```
with the following data 

```
{
  "email": "ck1@email.com",
  "password":"ck1#pass"
}
```

You should receive an access token with the following format 

```
{
   "accessToken": "<ACCESS_TOKEN>",
   "refreshToken": "<REFRESH_TOKEN>",
}
```


You should send this authorization with any request to the protected endpoints

```
Authorization: Bearer <ACCESS_TOKEN>
```
