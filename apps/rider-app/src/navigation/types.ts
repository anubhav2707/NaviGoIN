import type { NavigatorScreenParams } from '@react-navigation/native';

export type Point = { lat: number; lng: number };

export type VehicleType = 'mini' | 'sedan' | 'suv' | 'auto' | 'bike';

export type RideSelection = {
  vehicleType: VehicleType;
  label: string;
  fare: number;
};

// Trip details that flow through the booking stack so each screen can render
// the same pickup/drop/vehicle without re-fetching.
export type BookingContext = {
  pickupLabel: string;
  dropLabel: string;
  /** Intermediate stops between pickup and the final drop-off, in order. */
  stops?: string[];
  pickup: Point;
  drop: Point;
  distanceKm: number;
  durationMin: number;
};

export type AuthStackParamList = {
  Phone: undefined;
  Otp: { phone: string; existingUser: boolean; devCode?: string };
};

export type RootTabParamList = {
  Home: undefined;
  Activity: undefined;
  Payments: undefined;
  Safety: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  RouteSelection: { pickupLabel?: string; dropLabel?: string } | undefined;
  SelectRide: { booking: BookingContext };
  FindingDrivers: { booking: BookingContext; ride: RideSelection };
  RideConfirmed: { booking: BookingContext; ride: RideSelection; tripId?: string };
  LiveTripTracking: { booking: BookingContext; ride: RideSelection; tripId?: string };
  SavedCards: undefined;
  TrustedContacts: undefined;
  EmergencySettings: undefined;
  DriverChat: { driverName: string };
  HelpSupport: undefined;
  SupportTopic: { topicId: string };
  SupportChat: { topicTitle?: string } | undefined;
};
