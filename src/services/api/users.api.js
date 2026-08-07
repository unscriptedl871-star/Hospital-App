import { api } from "./api";

export const usersApi = {
  doctors() {
    return api.get("/users/doctors");
  },
};
