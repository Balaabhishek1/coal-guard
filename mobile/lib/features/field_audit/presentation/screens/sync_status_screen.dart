import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/sync_provider.dart';
import 'field_inspector_home_screen.dart';

/// Sync Status & Field Queue Management Screen
///
/// Provides field officers with transparency over pending offline SQLite records,
/// current surface connectivity states, and manual batch synchronization triggers.
class SyncStatusScreen extends ConsumerWidget {
  const SyncStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncProvider);
    final pendingInspectionsAsync = ref.watch(recentInspectionsProvider);

    final timeFormatter = DateFormat('yyyy-MM-dd HH:mm:ss');

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Offline Sync Dashboard'),
        actions: [
          IconButton(
            icon: syncState.isSyncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                    ),
                  )
                : const Icon(LucideIcons.refreshCw, size: 18),
            tooltip: 'Force Batch Sync',
            onPressed: syncState.isSyncing
                ? null
                : () async {
                    final result = await ref.read(syncProvider.notifier).triggerSync();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(result.message),
                          backgroundColor:
                              result.success ? AppTheme.success : AppTheme.danger,
                        ),
                      );
                    }
                  },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(syncProvider.notifier).refreshQueueCounts();
          ref.invalidate(recentInspectionsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Connectivity Status Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: syncState.isOnline
                          ? AppTheme.success.withOpacity(0.12)
                          : AppTheme.warning.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: syncState.isOnline ? AppTheme.success : AppTheme.warning,
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        syncState.isOnline ? LucideIcons.wifi : LucideIcons.wifiOff,
                        color: syncState.isOnline ? AppTheme.success : AppTheme.warning,
                        size: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          syncState.isOnline
                              ? 'Surface Gateway Connected'
                              : 'Underground Offline Mode',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          syncState.connectivityType,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Queue Metrics Grid
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    title: 'Pending Audits',
                    count: syncState.pendingRecordsCount,
                    icon: LucideIcons.fileText,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    title: 'Queued WebP Photos',
                    count: syncState.pendingMediaCount,
                    icon: LucideIcons.image,
                    color: AppTheme.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Force Sync Trigger Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Last Sync Attempt',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      Text(
                        syncState.lastSyncTime != null
                            ? timeFormatter.format(syncState.lastSyncTime!)
                            : 'No sync in this session',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                  if (syncState.lastSyncMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      syncState.lastSyncMessage!,
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    ),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: syncState.isSyncing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                            ),
                          )
                        : const Icon(LucideIcons.cloudUpload, size: 18),
                    label: Text(syncState.isSyncing
                        ? 'Uploading Batch to Surface...'
                        : 'Trigger Manual Batch Upload'),
                    onPressed: syncState.isSyncing
                        ? null
                        : () async {
                            final res = await ref.read(syncProvider.notifier).triggerSync();
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(res.message),
                                  backgroundColor:
                                      res.success ? AppTheme.success : AppTheme.danger,
                                ),
                              );
                            }
                          },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Pending Queue Items
            const Text(
              'Queued Form IV Records (SQLite)',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),

            pendingInspectionsAsync.when(
              data: (audits) {
                final pendingList =
                    audits.where((a) => a.syncStatus == 'PENDING').toList();

                if (pendingList.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(24),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Column(
                      children: [
                        Icon(LucideIcons.checkCheck, size: 28, color: AppTheme.success),
                        SizedBox(height: 8),
                        Text(
                          'Local queue is fully synchronized.',
                          style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: pendingList.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final audit = pendingList[index];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.clock, color: AppTheme.primary, size: 16),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Gallery: ${audit.locationId}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'CH4: ${audit.gasCh4Percent ?? 0.0}% • CO: ${audit.gasCoPpm ?? 0.0} PPM • Bolt: ${audit.roofBoltTorqueNm ?? 0.0} Nm',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'QUEUED',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Error loading queue: $e'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required int count,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 12),
          Text(
            count.toString(),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}
