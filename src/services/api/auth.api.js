import { api } from "./api";

export const authApi = {
  register(data) {
    return api.post("/auth/register", data);
  },

  login(data) {
    return api.post("/auth/login", data);
  },
};
