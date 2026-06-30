import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import MapBackground from '../components/MapBackground';

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <MapBackground>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Where to?</Text>
          </View>
          
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('RouteSelection')}
          >
            <Text style={styles.searchText}>Enter destination</Text>
          </TouchableOpacity>

          <View style={styles.bottomSheet}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity style={styles.recentItem}>
              <Text style={styles.recentTitle}>Office</Text>
              <Text style={styles.recentAddress}>123 Business Park, Sector 5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recentItem}>
              <Text style={styles.recentTitle}>Home</Text>
              <Text style={styles.recentAddress}>456 Residential Area, Block B</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827'
  },
  searchBar: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchText: {
    fontSize: 16,
    color: '#6b7280'
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  recentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4
  },
  recentAddress: {
    fontSize: 14,
    color: '#6b7280'
  }
});