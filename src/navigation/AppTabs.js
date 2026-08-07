import React, { useCallback, useContext, useMemo, useRef } from "react";
import { Animated } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthContext } from "../context/AuthContext";

// Existing screens
import DepartmentsScreen from "../screens/tabs/DepartmentsScreen";
import FindDoctorScreen from "../screens/tabs/FindDoctorScreen";
import BookAppointmentScreen from "../screens/tabs/BookAppointmentScreen";
import MyAppointmentScreen from "../screens/tabs/MyAppointmentScreen";
import ProfileScreen from "../screens/tabs/ProfileScreen";
import NotificationsScreen from "../screens/tabs/NotificationsScreen";

// ✅ NEW: real reports screen
import ReportsScreen from "../screens/admin/ReportsScreen";

// Chat stack
import ChatStack from "./ChatStack";

// Role dashboards
import PatientHomeScreen from "../screens/role/PatientHomeScreen";
import ReceptionHomeScreen from "../screens/role/ReceptionHomeScreen";
import DoctorHomeScreen from "../screens/role/DoctorHomeScreen";
import AdminHomeScreen from "../screens/role/AdminHomeScreen";

const Tab = createBottomTabNavigator();

function FadeOnFocus({ children }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, [opacity])
  );

  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}

function wrap(Screen) {
  return (props) => (
    <FadeOnFocus>
      <Screen {...props} />
    </FadeOnFocus>
  );
}

export default function AppTabs() {
  const { user } = useContext(AuthContext);

  const role = String(user?.role || "patient").trim().toLowerCase();

  const HomeForRole = useMemo(() => {
    if (role === "reception" || role === "receptionist") return ReceptionHomeScreen;
    if (role === "doctor") return DoctorHomeScreen;
    if (role === "admin") return AdminHomeScreen;
    return PatientHomeScreen;
  }, [role]);

  const tabs = useMemo(() => {
    if (role === "patient") {
      return [
        { name: "Home", component: HomeForRole },
        { name: "Departments", component: DepartmentsScreen },
        { name: "Find Doctor", component: FindDoctorScreen },
        { name: "Book", component: BookAppointmentScreen },
        { name: "Appointments", component: MyAppointmentScreen },
        { name: "Chat", component: ChatStack },
        { name: "Profile", component: ProfileScreen },
      ];
    }

    if (role === "reception" || role === "receptionist") {
      return [
        { name: "Dashboard", component: HomeForRole },
        { name: "Queue", component: MyAppointmentScreen },
        { name: "Chat", component: ChatStack },
        { name: "Payments", component: NotificationsScreen },
        { name: "Profile", component: ProfileScreen },
      ];
    }

    if (role === "doctor") {
      return [
        { name: "Dashboard", component: HomeForRole },
        { name: "Today", component: MyAppointmentScreen },
        { name: "Prescriptions", component: NotificationsScreen },
        { name: "Chat", component: ChatStack },
        { name: "Profile", component: ProfileScreen },
      ];
    }

    // ✅ Admin
    return [
      { name: "Dashboard", component: HomeForRole },
      { name: "Users", component: NotificationsScreen }, // later
      { name: "Reports", component: ReportsScreen },     // ✅ real now
      { name: "Settings", component: NotificationsScreen }, // later
      { name: "Profile", component: ProfileScreen },
    ];
  }, [role, HomeForRole]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      {tabs.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component === ChatStack ? t.component : wrap(t.component)}
        />
      ))}
    </Tab.Navigator>
  );
}
