import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput
} from 'react-native';
import MapBackground from '../../components/MapBackground';

export default function RouteSelectionScreen({ navigation }: any) {
  const [pickup, setPickup] = useState('Current Location');
  const [destination, setDestination] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <MapBackground showPin={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Set Route</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputDot} />
              <TextInput
                style={styles.input}
                value={pickup}
                onChangeText={setPickup}
                placeholder="Pickup location"
              />
            </View>
            <View style={styles.inputWrapper}>
              <View style={[styles.inputDot, styles.dropDot]} />
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="Drop location"
                autoFocus
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => navigation.navigate('LiveTripTracking')}
          >
            <Text style={styles.confirmText}>Confirm Route</Text>
          </TouchableOpacity>
        </View>
      </MapBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    zIndex: 3
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16
  },
  backButton: {
    marginRight: 16
  },
  backText: {
    fontSize: 24,
    color: '#111827'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  inputContainer: {
    paddingHorizontal: 20,
    gap: 12
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  inputDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 12
  },
  dropDot: {
    backgroundColor: '#EF4444'
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827'
  },
  confirmButton: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  }
});