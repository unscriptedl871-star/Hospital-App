import React, { useContext, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext } from "../context/AuthContext";
import AuthStack from "./AuthStack";
import AppTabs from "./AppTabs";
import DoctorDetailScreen from "../screens/tabs/DoctorDetailScreen";
import PatientProfileScreen from "../screens/role/PatientProfileScreen";


const Stack = createNativeStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
  name="PatientProfile"
  component={PatientProfileScreen}
  options={{ animation: "slide_from_right" }}
/>

    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useContext(AuthContext);

  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(40);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, opacity, translateY]);

  return (
    <NavigationContainer>
      <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
        {user ? <AppStack /> : <AuthStack />}
      </Animated.View>
    </NavigationContainer>
  );
}
