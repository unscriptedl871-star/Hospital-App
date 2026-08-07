import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * CHANGE THIS IP to your PC's IPv4 address
 * Example: http://192.168.1.10:4000
 */
export const BASE_URL = "http://192.168.1.100:4000";

async function request(url, options = {}) {
  const token = await AsyncStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.message || "API error");
  }

  return data;
}

export const api = {
  health: () => request("/health"),
  get: (url) => request(url),
  post: (url, body) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  patch: (url, body) =>
    request(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const appointmentsApi = {
  myAppointments: () => api.get("/appointments/my"),
  queue: () => api.get("/appointments/queue"),
  today: () => api.get("/appointments/today"),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`, {}),
};

