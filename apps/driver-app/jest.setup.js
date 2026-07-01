import '@testing-library/jest-native/extend-expect';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      mapplsMapKey: 'test-key'
    }
  }
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
  FontAwesome: 'FontAwesome'
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {}
  }),
}));