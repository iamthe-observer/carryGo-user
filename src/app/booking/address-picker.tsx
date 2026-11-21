import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bookmark,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Search,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarryGoMap } from '@/components/map/CarryGoMap';
import { Button } from '@/components/ui/Button';
import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  getCurrentUserLocation,
  reverseGeocodePoint,
  searchPlaces,
} from '@/services/geo';
import { triggerHaptic } from '@/services/notifications';
import { useCarryGoStore } from '@/store/useCarryGoStore';
import { GeoPoint, LocationSelection } from '@/types/delivery';

export default function AddressPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string }>();
  const target = params.target === 'pickup' ? 'pickup' : 'dropoff';

  const { palette } = useAppTheme();
  const savedAddresses = useCarryGoStore((s) => s.savedAddresses);
  const setPickup = useCarryGoStore((s) => s.setPickup);
  const setDropoff = useCarryGoStore((s) => s.setDropoff);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSelection[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapPickMode, setMapPickMode] = useState(false);
  const [pinnedLocation, setPinnedLocation] =
    useState<LocationSelection | null>(null);

  useEffect(() => {
    let active = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      const places = await searchPlaces(query);
      if (active) {
        setResults(places);
        setSearching(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const commitSelection = (loc: LocationSelection) => {
    triggerHaptic('light');
    if (target === 'pickup') {
      setPickup(loc);
    } else {
      setDropoff(loc);
    }
    router.back();
  };

  const handleCurrentGps = async () => {
    setLocating(true);
    const loc = await getCurrentUserLocation();
    setLocating(false);
    if (loc) {
      commitSelection(loc);
    }
  };

  const handleMapTap = async (coord: GeoPoint) => {
    triggerHaptic('light');
    const resolved = await reverseGeocodePoint(coord);
    setPinnedLocation(resolved);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: palette.ink }]}>
            {target === 'pickup' ? 'Select Pickup Point' : 'Select Drop-off'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.closeBtn,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <X size={18} color={palette.ink} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Search size={18} color={palette.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search street, landmark, or area in Accra..."
            placeholderTextColor={palette.inkMuted}
            autoFocus={!mapPickMode}
            style={[styles.input, { color: palette.ink }]}
          />
          {searching && <ActivityIndicator size="small" color={palette.brand} />}
        </View>

        <View style={styles.quickRow}>
          <Pressable
            onPress={handleCurrentGps}
            style={[
              styles.actionChip,
              { backgroundColor: palette.mintSoft, borderColor: palette.mint },
            ]}
          >
            {locating ? (
              <ActivityIndicator size="small" color={palette.mint} />
            ) : (
              <LocateFixed size={15} color={palette.mint} />
            )}
            <Text style={[styles.actionChipText, { color: palette.mint }]}>
              Current GPS
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMapPickMode((prev) => !prev)}
            style={[
              styles.actionChip,
              {
                backgroundColor: mapPickMode
                  ? palette.ink
                  : palette.surface,
                borderColor: mapPickMode ? palette.ink : palette.border,
              },
            ]}
          >
            <MapIcon
              size={15}
              color={mapPickMode ? palette.inkInverse : palette.ink}
            />
            <Text
              style={[
                styles.actionChipText,
                { color: mapPickMode ? palette.inkInverse : palette.ink },
              ]}
            >
              {mapPickMode ? 'Back to Search' : 'Pick on Map'}
            </Text>
          </Pressable>
        </View>
      </View>

      {mapPickMode ? (
        <View style={styles.mapPickWrap}>
          <CarryGoMap
            pickup={target === 'pickup' ? pinnedLocation : null}
            dropoff={target === 'dropoff' ? pinnedLocation : null}
            onMapPress={handleMapTap}
            bottomPadding={140}
          />
          <View
            style={[
              styles.mapPinCard,
              Shadows.floating,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.mapHint, { color: palette.inkSecondary }]}>
              {pinnedLocation
                ? pinnedLocation.addressLine
                : 'Tap anywhere on the map to drop a pin'}
            </Text>
            <Button
              title={
                pinnedLocation
                  ? `Confirm ${pinnedLocation.label}`
                  : 'Tap Map to Pin'
              }
              disabled={!pinnedLocation}
              variant="brand"
              onPress={() => {
                if (pinnedLocation) commitSelection(pinnedLocation);
              }}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) =>
            `${item.latitude}-${item.longitude}-${index}`
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            savedAddresses.length > 0 && !query.trim() ? (
              <View style={styles.savedSection}>
                <Text style={[styles.sectionLabel, { color: palette.inkMuted }]}>
                  SAVED PLACES
                </Text>
                {savedAddresses.map((addr) => (
                  <Pressable
                    key={addr.id}
                    onPress={() =>
                      commitSelection({
                        label: addr.label,
                        addressLine: addr.addressLine,
                        latitude: addr.latitude,
                        longitude: addr.longitude,
                      })
                    }
                    style={[
                      styles.rowCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        { backgroundColor: palette.brandSoft },
                      ]}
                    >
                      <Bookmark size={16} color={palette.brand} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, { color: palette.ink }]}>
                        {addr.label}
                      </Text>
                      <Text
                        style={[
                          styles.rowSub,
                          { color: palette.inkSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {addr.addressLine}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: palette.inkMuted, marginTop: 8 },
                  ]}
                >
                  SUGGESTED LOCATIONS
                </Text>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => commitSelection(item)}
              style={[
                styles.rowCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View
                style={[styles.rowIcon, { backgroundColor: palette.surfaceAlt }]}
              >
                <MapPin size={16} color={palette.ink} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: palette.ink }]}>
                  {item.label}
                </Text>
                <Text
                  style={[styles.rowSub, { color: palette.inkSecondary }]}
                  numberOfLines={1}
                >
                  {item.addressLine}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 8,
  },
  savedSection: {
    gap: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 12.5,
  },
  mapPickWrap: {
    flex: 1,
    position: 'relative',
  },
  mapPinCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 12,
  },
  mapHint: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
