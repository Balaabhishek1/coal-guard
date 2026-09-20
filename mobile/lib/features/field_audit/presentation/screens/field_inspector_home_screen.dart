import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/local/form_iv_dao.dart';
import '../../data/models/form_iv_local_model.dart';

final formIvDaoProvider = Provider<FormIvDao>((ref) {
  return FormIvDao();
});

final pendingInspectionsCountProvider = FutureProvider<int>((ref) async {
  final dao = ref.watch(formIvDaoProvider);
  return await dao.getPendingCount();
});

final recentInspectionsProvider = FutureProvider<List<FormIvLocalModel>>((ref) async {
  final dao = ref.watch(formIvDaoProvider);
  return await dao.getAllInspections(limit: 10);
});

/// Field Inspector Home Screen (Module 4 Dashboard)
class FieldInspectorHomeScreen extends ConsumerWidget {
  const FieldInspectorHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final pendingCountAsync = ref.watch(pendingInspectionsCountProvider);
    final recentAuditsAsync = ref.watch(recentInspectionsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(LucideIcons.shieldAlert, size: 20, color: AppTheme.primary),
            const SizedBox(width: 8),
            const Text('Inspection Console'),
            const SizedBox(width: 10),
            // Mode Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: authState.isOfflineMode
                    ? AppTheme.warning.withOpacity(0.2)
                    : AppTheme.success.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: authState.isOfflineMode ? AppTheme.warning : AppTheme.success,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: authState.isOfflineMode ? AppTheme.warning : AppTheme.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    authState.isOfflineMode ? 'OFFLINE' : 'ONLINE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: authState.isOfflineMode ? AppTheme.warning : AppTheme.success,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, size: 18),
            tooltip: 'Sign Out',
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(pendingInspectionsCountProvider);
          ref.invalidate(recentInspectionsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Inspector Profile Card
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
                      color: AppTheme.surfaceHigh,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
                    ),
                    child: const Center(
                      child: Icon(LucideIcons.hardHat, color: AppTheme.primary, size: 22),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authState.fullName ?? 'Overman Sirdar',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Designation: ${authState.role ?? "OVERMAN"} • Sector IX Incline',
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

            // Pending Queue Card
            pendingCountAsync.when(
              data: (count) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: count > 0
                            ? AppTheme.primary.withOpacity(0.15)
                            : AppTheme.success.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        LucideIcons.cloudUpload,
                        color: count > 0 ? AppTheme.primary : AppTheme.success,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$count Form IV Records Pending Sync',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Will automatically upload when connected to surface Wi-Fi',
                            style: TextStyle(
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
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 24),

            // Section Header: Recent Audits
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Offline Inspections',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.refreshCw, size: 14, color: AppTheme.textMuted),
                  onPressed: () {
                    ref.invalidate(pendingInspectionsCountProvider);
                    ref.invalidate(recentInspectionsProvider);
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Audit Records List
            recentAuditsAsync.when(
              data: (audits) {
                if (audits.isEmpty) {
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
                        Icon(LucideIcons.clipboardList, size: 32, color: AppTheme.textMuted),
                        SizedBox(height: 8),
                        Text(
                          'No local Form IV records stored yet.',
                          style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Log underground shift audits to view offline records here.',
                          style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: audits.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final audit = audits[index];
                    final isSynced = audit.syncStatus == 'SYNCED';

                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isSynced ? LucideIcons.checkCircle : LucideIcons.clock,
                            color: isSynced ? AppTheme.success : AppTheme.primary,
                            size: 16,
                          ),
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
                              color: isSynced
                                  ? AppTheme.success.withOpacity(0.12)
                                  : AppTheme.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              audit.syncStatus,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: isSynced ? AppTheme.success : AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
              error: (err, _) => Text(
                'Failed to load local records: $err',
                style: const TextStyle(color: AppTheme.danger, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
