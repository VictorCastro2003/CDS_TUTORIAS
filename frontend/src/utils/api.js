const API_URL = "http://localhost:4000/api";

export const registerUser = async (name, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password })
  });
  return res.json();
};

export const loginUser = async (name, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password })
  });
  return res.json();
};

export const fetchMe = async (token) => {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return res.json();
};
