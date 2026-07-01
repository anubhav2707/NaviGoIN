export type AuthStackParamList = {
  Phone: undefined;
  Otp: {
    phone: string;
    existingUser: boolean;
    devCode?: string;
  };
};

export type RootTabParamList = {
  Home: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  TripRequest: {
    tripId: string;
    pickup: {
      address: string;
      lat: number;
      lng: number;
    };
    dropoff: {
      address: string;
      lat: number;
      lng: number;
    };
    fare: number;
    distance: number;
    duration: number;
  };
  ActiveTrip: {
    tripId: string;
  };
  Navigation: {
    tripId: string;
    destination: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  TripComplete: {
    tripId: string;
    earnings: number;
  };
  EarningsDetails: {
    date?: string;
  };
  ProfileEdit: undefined;
  Documents: undefined;
  Support: undefined;
  Settings: undefined;
};