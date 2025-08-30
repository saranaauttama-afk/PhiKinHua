import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  // ไม่ใส่ className หรือ style ใดๆ ที่นี่ เพื่อตัดสาเหตุ fragment style
  return <Stack screenOptions={{ headerShown: false }} />;
}