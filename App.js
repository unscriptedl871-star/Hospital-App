import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { AppDataProvider } from "./src/context/AppDataContext";

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <RootNavigator />
      </AppDataProvider>
    </AuthProvider>
  );
}
