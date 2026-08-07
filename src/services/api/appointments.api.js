import { api } from "./api";

export const appointmentsApi = {
  // Patient
  myAppointments: () => api.get("/appointments/my"),

  // Doctor
  today: () => api.get("/appointments/today"),

  // Reception
  queue: () => api.get("/appointments/queue"),

  // Create
  create: (data) => api.post("/appointments", data),

  // Update status
  updateStatus: (id, status) =>
    api.patch(`/appointments/${id}/status`, { status }),

  // ✅ CANCEL (THIS IS THE FIX)
  cancel: (id) =>
    api.patch(`/appointments/${id}/cancel`),
};
