import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="mypage" />
        <Stack.Screen name="create-link" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>

      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}