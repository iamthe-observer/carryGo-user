import { Bike, Car, MapPin, Navigation } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
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
  driverCoordinate,
  vehicleTier = 'bike',
}: CarryGoMapProps) {
  const { palette } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
      ]}
    >
      <View style={styles.badge}>
        <Navigation size={15} color={palette.brand} />
        <Text style={[styles.badgeText, { color: palette.ink }]}>
          Accra Live Map Preview (Native Map renders on iOS / Android Expo Go)
        </Text>
      </View>

      <View style={styles.pinsRow}>
        {pickup && (
          <View style={[styles.pinCard, { backgroundColor: palette.surface }]}>
            <View style={[styles.dot, { backgroundColor: palette.mint }]} />
            <Text style={[styles.pinText, { color: palette.ink }]} numberOfLines={1}>
              Pickup: {pickup.label}
            </Text>
          </View>
        )}
        {dropoff && (
          <View style={[styles.pinCard, { backgroundColor: palette.surface }]}>
            <MapPin size={14} color={palette.brand} />
            <Text style={[styles.pinText, { color: palette.ink }]} numberOfLines={1}>
              Drop-off: {dropoff.label}
            </Text>
          </View>
        )}
        {driverCoordinate && (
          <View style={[styles.pinCard, { backgroundColor: palette.ink }]}>
            {vehicleTier === 'bike' ? (
              <Bike size={14} color="#FFFFFF" />
            ) : (
              <Car size={14} color="#FFFFFF" />
            )}
            <Text style={[styles.pinText, { color: palette.inkInverse }]}>
              Courier Live GPS Active
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pinsRow: {
    gap: 8,
    width: '100%',
    maxWidth: 360,
  },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pinText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
