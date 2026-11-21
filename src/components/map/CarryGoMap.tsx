import { Bike, Car, MapPin } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

import { APP_CONFIG } from '@/constants/config';
import { DarkMapStyle, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { GeoPoint, LocationSelection, VehicleTier } from '@/types/delivery';

export interface CarryGoMapProps {
  pickup?: LocationSelection | null;
  dropoff?: LocationSelection | null;
  routeCoordinates?: GeoPoint[];
  driverCoordinate?: GeoPoint | null;
  driverHeading?: number;
  vehicleTier?: VehicleTier;
  interactive?: boolean;
  onMapPress?: (coord: GeoPoint) => void;
  bottomPadding?: number;
}

export function CarryGoMap({
  pickup,
  dropoff,
  routeCoordinates = [],
  driverCoordinate,
  driverHeading = 0,
  vehicleTier = 'bike',
  interactive = true,
  onMapPress,
  bottomPadding = 260,
}: CarryGoMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const { isDark, palette } = useAppTheme();

  const initialRegion: Region = pickup
    ? {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.038,
      }
    : APP_CONFIG.defaultRegion;

  useEffect(() => {
    const points: GeoPoint[] = [];
    if (pickup) points.push(pickup);
    if (dropoff) points.push(dropoff);
    if (driverCoordinate) points.push(driverCoordinate);

    if (points.length >= 2 && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: {
            top: 90,
            right: 54,
            bottom: bottomPadding,
            left: 54,
          },
          animated: true,
        });
      }, 220);
      return () => clearTimeout(timer);
    } else if (points.length === 1 && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.03,
        },
        350
      );
    }
  }, [
    pickup?.latitude,
    pickup?.longitude,
    dropoff?.latitude,
    dropoff?.longitude,
    driverCoordinate?.latitude,
    driverCoordinate?.longitude,
    bottomPadding,
  ]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={Platform.OS === 'android' && isDark ? DarkMapStyle : undefined}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        onPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        {routeCoordinates.length > 1 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={isDark ? '#111318' : '#FFFFFF'}
              strokeWidth={7}
            />
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={palette.brand}
              strokeWidth={4.5}
            />
          </>
        )}

        {pickup && (
          <Marker
            coordinate={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            }}
            title="Pickup"
            description={pickup.addressLine}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.pickupMarker, Shadows.card]}>
              <View style={[styles.pickupInner, { backgroundColor: palette.mint }]} />
            </View>
          </Marker>
        )}

        {dropoff && (
          <Marker
            coordinate={{
              latitude: dropoff.latitude,
              longitude: dropoff.longitude,
            }}
            title="Drop-off"
            description={dropoff.addressLine}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.dropoffWrap}>
              <View
                style={[
                  styles.dropoffBadge,
                  Shadows.card,
                  { backgroundColor: palette.brand },
                ]}
              >
                <MapPin size={16} color="#FFFFFF" />
              </View>
              <View style={[styles.pinStem, { backgroundColor: palette.brand }]} />
            </View>
          </Marker>
        )}

        {driverCoordinate && (
          <Marker
            coordinate={driverCoordinate}
            title="CarryGo Courier"
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View
              style={[
                styles.driverBubble,
                Shadows.floating,
                {
                  backgroundColor: palette.ink,
                  borderColor: palette.brand,
                  transform: [{ rotate: `${driverHeading * 0.15}deg` }],
                },
              ]}
            >
              {vehicleTier === 'bike' ? (
                <Bike size={18} color="#FFFFFF" />
              ) : (
                <Car size={18} color="#FFFFFF" />
              )}
              <Text style={styles.driverTag}>CG</Text>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111318',
  },
  pickupInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  dropoffWrap: {
    alignItems: 'center',
  },
  dropoffBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pinStem: {
    width: 3,
    height: 7,
    borderRadius: 2,
    marginTop: -2,
  },
  driverBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
  },
  driverTag: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '800',
  },
});
