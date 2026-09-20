import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/db_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/storage/local_db_service.dart';
import '../data/local/form_iv_dao.dart';
import '../services/sync_engine_service.dart';

class SyncState {
  final bool isSyncing;
  final int pendingRecordsCount;
  final int pendingMediaCount;
  final bool isOnline;
  final String connectivityType;
  final DateTime? lastSyncTime;
  final String? lastSyncMessage;

  const SyncState({
    this.isSyncing = false,
    this.pendingRecordsCount = 0,
    this.pendingMediaCount = 0,
    this.isOnline = false,
    this.connectivityType = 'Checking...',
    this.lastSyncTime,
    this.lastSyncMessage,
  });

  SyncState copyWith({
    bool? isSyncing,
    int? pendingRecordsCount,
    int? pendingMediaCount,
    bool? isOnline,
    String? connectivityType,
    DateTime? lastSyncTime,
    String? lastSyncMessage,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      pendingRecordsCount: pendingRecordsCount ?? this.pendingRecordsCount,
      pendingMediaCount: pendingMediaCount ?? this.pendingMediaCount,
      isOnline: isOnline ?? this.isOnline,
      connectivityType: connectivityType ?? this.connectivityType,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      lastSyncMessage: lastSyncMessage ?? this.lastSyncMessage,
    );
  }
}

class SyncNotifier extends StateNotifier<SyncState> {
  final SyncEngineService _syncEngine;
  final FormIvDao _formIvDao;
  final LocalDbService _dbService;
  final ConnectivityService _connectivity;

  SyncNotifier({
    required SyncEngineService syncEngine,
    required FormIvDao formIvDao,
    required LocalDbService dbService,
    required ConnectivityService connectivity,
  })  : _syncEngine = syncEngine,
        _formIvDao = formIvDao,
        _dbService = dbService,
        _connectivity = connectivity,
        super(const SyncState()) {
    _init();
  }

  Future<void> _init() async {
    await refreshQueueCounts();

    // Start auto-sync listener
    _syncEngine.startAutoSyncListener(
      onSyncCompleted: () {
        refreshQueueCounts();
      },
    );

    // Watch connectivity changes
    _connectivity.onConnectivityChanged.listen((isOnline) async {
      final type = await _connectivity.getConnectivityType();
      state = state.copyWith(isOnline: isOnline, connectivityType: type);
    });
  }

  Future<void> refreshQueueCounts() async {
    final recordsCount = await _formIvDao.getPendingCount();

    int mediaCount = 0;
    try {
      final db = await _dbService.database;
      final mediaResults = await db.rawQuery(
        'SELECT COUNT(*) as cnt FROM ${DbConstants.inspectionMediaTable} WHERE sync_status = ?',
        [DbConstants.statusPending],
      );
      if (mediaResults.isNotEmpty) {
        mediaCount = (mediaResults.first['cnt'] as int?) ?? 0;
      }
    } catch (_) {}

    final isOnline = await _connectivity.isOnline();
    final type = await _connectivity.getConnectivityType();

    state = state.copyWith(
      pendingRecordsCount: recordsCount,
      pendingMediaCount: mediaCount,
      isOnline: isOnline,
      connectivityType: type,
    );
  }

  Future<SyncResult> triggerSync() async {
    state = state.copyWith(isSyncing: true);

    final result = await _syncEngine.triggerSync();
    await refreshQueueCounts();

    state = state.copyWith(
      isSyncing: false,
      lastSyncTime: DateTime.now(),
      lastSyncMessage: result.message,
    );

    return result;
  }
}

// Providers
final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  return ConnectivityService();
});

final syncEngineServiceProvider = Provider<SyncEngineService>((ref) {
  final apiClient = ApiClient();
  final formIvDao = FormIvDao();
  final dbService = LocalDbService.instance;
  final connectivity = ref.watch(connectivityServiceProvider);

  return SyncEngineService(
    apiClient: apiClient,
    formIvDao: formIvDao,
    dbService: dbService,
    connectivity: connectivity,
  );
});

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  return SyncNotifier(
    syncEngine: ref.watch(syncEngineServiceProvider),
    formIvDao: FormIvDao(),
    dbService: LocalDbService.instance,
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final syncQueueProvider = FutureProvider<int>((ref) async {
  final dao = FormIvDao();
  return await dao.getPendingCount();
});
