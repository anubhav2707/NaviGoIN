import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import TripMap, { TripPhase } from '../../components/TripMap';
import { LatLng } from '../../types/geo';

export default function LiveTripTrackingScreen({ navigation }: any) {
  const [phase, setPhase] = useState<TripPhase>('pickup_arriving');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(5);

  // Mock locations
  const pickupLocation: LatLng = { lat: 28.6139, lng: 77.2090 };
  const dropLocation: LatLng = { lat: 28.6050, lng: 77.2000 };

  // Simulate trip progression
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 0.05, 1);
        
        // Update phase based on progress
        if (phase === 'pickup_arriving' && newProgress >= 1) {
          setPhase('pickup_reached');
          setTimeout(() => {
            setPhase('trip_started');
            setProgress(0);
          }, 3000);
        } else if (phase === 'trip_started' && newProgress >= 0.9) {
          setPhase('trip_ending');
        }

        return newProgress;
      });

      setEta(prev => Math.max(0, prev - 1));
    }, 2000);

    return () => clearInterval(interval);
  }, [phase]);

  const getStatusText = () => {
    switch (phase) {
      case 'pickup_arriving':
        return 'Driver is arriving';
      case 'pickup_reached':
        return 'Driver has arrived';
      case 'trip_started':
        return 'On the way';
      case 'trip_ending':
        return 'Arriving at destination';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TripMap
        phase={phase}
        progress={progress}
        pickupLocation={pickupLocation}
        dropLocation={dropLocation}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <View style={styles.etaContainer}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>{eta} min</Text>
          </View>
          
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>D</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>Driver Name</Text>
              <Text style={styles.vehicleInfo}>White Toyota Camry • ABC-1234</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>Message</Text>
            </TouchableOpacity>
            {phase === 'pickup_reached' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => {
                  setPhase('trip_started');
                  setProgress(0);
                }}
              >
                <Text style={[styles.actionText, styles.primaryActionText]}>I'm here</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  backText: {
    fontSize: 24,
    color: '#111827'
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  etaLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6'
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  driverInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280'
  },
  driverDetails: {
    flex: 1
  },
  driverName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center'
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151'
  },
  primaryActionText: {
    color: 'white'
  }
});