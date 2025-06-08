let accessToken: string | null = null;
let userId: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
  // axios가 이미 import되어 있다고 가정
  // (import 순서상 문제 없도록, require 사용)
  const axios = require('axios');
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function getAccessToken() {
  return accessToken;
}

export function setUserId(id: string) {
  userId = id;
}

export function getUserId() {
  return userId;
}

export function clearAuth() {
  accessToken = null;
  userId = null;
  const axios = require('axios');
  delete axios.defaults.headers.common['Authorization'];
} 