import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, typography } from '../theme/theme';
import type { RootStackParamList, RootTabParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import SafetyScreen from '../screens/SafetyScreen';
import AccountScreen from '../screens/AccountScreen';

import RouteSelectionScreen from '../screens/booking/RouteSelectionScreen';
import SelectRideScreen from '../screens/booking/SelectRideScreen';
import FindingDriversScreen from '../screens/booking/FindingDriversScreen';
import RideConfirmedScreen from '../screens/booking/RideConfirmedScreen';
import LiveTripTrackingScreen from '../screens/booking/LiveTripTrackingScreen';

import SavedCardsScreen from '../screens/SavedCardsScreen';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';
import EmergencySettingsScreen from '../screens/EmergencySettingsScreen';
import DriverChatScreen from '../screens/DriverChatScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import SupportTopicScreen from '../screens/SupportTopicScreen';
import SupportChatScreen from '../screens/SupportChatScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Activity: 'history',
  Payments: 'payments',
  Safety: 'security',
  Account: 'person',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
          height: 80,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarLabelStyle: { ...typography.labelMd },
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons
            name={TAB_ICONS[route.name as keyof RootTabParamList]}
            color={color}
            size={size ?? 24}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Safety" component={SafetyScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

// The main (authenticated) app stack. Mounted by AppNavigator once a user is signed in.
export default function RootNavigator() {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />

        {/* Booking flow — presented over the tabs */}
        <Stack.Screen name="RouteSelection" component={RouteSelectionScreen} />
        <Stack.Screen name="SelectRide" component={SelectRideScreen} />
        <Stack.Screen name="FindingDrivers" component={FindingDriversScreen} />
        <Stack.Screen name="RideConfirmed" component={RideConfirmedScreen} />
        <Stack.Screen name="LiveTripTracking" component={LiveTripTrackingScreen} />

        {/* Sub-screens reached from the tabs */}
        <Stack.Screen name="SavedCards" component={SavedCardsScreen} />
        <Stack.Screen name="TrustedContacts" component={TrustedContactsScreen} />
        <Stack.Screen name="EmergencySettings" component={EmergencySettingsScreen} />
        <Stack.Screen name="DriverChat" component={DriverChatScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="SupportTopic" component={SupportTopicScreen} />
        <Stack.Screen name="SupportChat" component={SupportChatScreen} />
      </Stack.Navigator>
  );
}
