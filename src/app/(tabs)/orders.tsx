import { useRouter } from 'expo-router';
import {
  Bike,
  Car,
  ChevronRight,
  Package,
  RotateCcw,
  Search,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatCurrency, formatDistance } from '@/services/pricing';
import { useCarryGoStore } from '@/store/useCarryGoStore';
import { DeliveryOrder } from '@/types/delivery';

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

export default function OrdersScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const orders = useCarryGoStore((s) => s.orders);
  const loadReorderDraft = useCarryGoStore((s) => s.loadReorderDraft);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === 'active') {
        if (o.status === 'delivered' || o.status === 'cancelled') return false;
      } else if (filter === 'delivered' && o.status !== 'delivered') {
        return false;
      } else if (filter === 'cancelled' && o.status !== 'cancelled') {
        return false;
      }

      if (!q) return true;
      return (
        o.trackingCode.toLowerCase().includes(q) ||
        o.pickup.addressLine.toLowerCase().includes(q) ||
        o.dropoff.addressLine.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q)
      );
    });
  }, [orders, filter, query]);

  const handleReorder = (order: DeliveryOrder) => {
    loadReorderDraft(order);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: palette.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.ink }]}>Deliveries</Text>
        <Text style={[styles.subtitle, { color: palette.inkSecondary }]}>
          Track active dispatches, inspect receipts, or re-order in 1 tap.
        </Text>

        <View
          style={[
            styles.searchBox,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Search size={17} color={palette.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tracking code, recipient, or area..."
            placeholderTextColor={palette.inkMuted}
            style={[styles.searchInput, { color: palette.ink }]}
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'active', 'delivered', 'cancelled'] as const).map((tab) => {
            const selected = filter === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected
                      ? palette.ink
                      : palette.surfaceAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: selected ? palette.inkInverse : palette.ink },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Package size={36} color={palette.inkMuted} />
            <Text style={[styles.emptyText, { color: palette.inkSecondary }]}>
              No matching deliveries found.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const IconComp = item.vehicleTier === 'bike' ? Bike : Car;
          return (
            <Pressable
              onPress={() => router.push(`/order/${item.id}`)}
              style={[
                styles.card,
                Shadows.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.codeRow}>
                  <View
                    style={[
                      styles.vehicleIcon,
                      { backgroundColor: palette.surfaceAlt },
                    ]}
                  >
                    <IconComp size={17} color={palette.ink} />
                  </View>
                  <View>
                    <Text style={[styles.codeText, { color: palette.ink }]}>
                      {item.trackingCode}
                    </Text>
                    <Text style={[styles.dateText, { color: palette.inkMuted }]}>
                      {new Date(item.createdAt).toLocaleDateString()} ·{' '}
                      {formatDistance(item.distanceKm)}
                    </Text>
                  </View>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.routeSnippet}>
                <Text
                  style={[styles.routeLine, { color: palette.inkSecondary }]}
                  numberOfLines={1}
                >
                  From: <Text style={{ color: palette.ink }}>{item.pickup.label}</Text>
                </Text>
                <Text
                  style={[styles.routeLine, { color: palette.inkSecondary }]}
                  numberOfLines={1}
                >
                  To:{' '}
                  <Text style={{ color: palette.ink }}>
                    {item.dropoff.label} ({item.recipientName})
                  </Text>
                </Text>
              </View>

              <View
                style={[styles.cardBottom, { borderTopColor: palette.border }]}
              >
                <Text style={[styles.fareText, { color: palette.ink }]}>
                  {formatCurrency(item.totalFare)}
                </Text>

                <View style={styles.bottomActions}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReorder(item);
                    }}
                    style={[
                      styles.reorderBtn,
                      { backgroundColor: palette.brandSoft },
                    ]}
                  >
                    <RotateCcw size={13} color={palette.brand} />
                    <Text style={[styles.reorderText, { color: palette.brand }]}>
                      Re-order
                    </Text>
                  </Pressable>
                  <ChevronRight size={18} color={palette.inkMuted} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
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
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 13.5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  routeSnippet: {
    gap: 3,
  },
  routeLine: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  fareText: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
