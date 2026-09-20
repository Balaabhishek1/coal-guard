import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:uuid/uuid.dart';
import '../../../../core/constants/db_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/storage/local_db_service.dart';
import '../data/local/form_iv_dao.dart';
import '../data/models/form_iv_local_model.dart';

class SyncResult {
  final bool success;
  final int recordsSynced;
  final int mediaFilesSynced;
  final String message;

  const SyncResult({
    required this.success,
    this.recordsSynced = 0,
    this.mediaFilesSynced = 0,
    required this.message,
  });
}

/// Autonomous Background Synchronization Engine
///
/// Manages batch uploading of pending SQLite Form IV audits with strict UUID
/// idempotency and streams chunked WebP photos to the surface backend.
class SyncEngineService {
  final ApiClient _apiClient;
  final FormIvDao _formIvDao;
  final LocalDbService _dbService;
  final ConnectivityService _connectivity;
  static final _uuid = Uuid();

  StreamSubscription<bool>? _connectivitySub;
  bool _isSyncing = false;

  SyncEngineService({
    ApiClient? apiClient,
    FormIvDao? formIvDao,
    LocalDbService? dbService,
    ConnectivityService? connectivity,
  })  : _apiClient = apiClient ?? ApiClient(),
        _formIvDao = formIvDao ?? FormIvDao(),
        _dbService = dbService ?? LocalDbService.instance,
        _connectivity = connectivity ?? ConnectivityService();

  /// Starts listening to network availability transitions
  void startAutoSyncListener({VoidCallback? onSyncCompleted}) {
    _connectivitySub = _connectivity.onConnectivityChanged.listen((isOnline) {
      if (isOnline && !_isSyncing) {
        triggerSync().then((_) {
          onSyncCompleted?.call();
        });
      }
    });
  }

  void dispose() {
    _connectivitySub?.cancel();
  }

  /// Triggers immediate batch synchronization of pending records and media
  Future<SyncResult> triggerSync() async {
    if (_isSyncing) {
      return const SyncResult(
        success: false,
        message: 'Synchronization already in progress.',
      );
    }

    final isOnline = await _connectivity.isOnline();
    if (!isOnline) {
      return const SyncResult(
        success: false,
        message: 'Underground offline. Wi-Fi or cellular network unavailable.',
      );
    }

    _isSyncing = true;
    int syncedRecords = 0;
    int syncedMedia = 0;

    try {
      // =======================================================================
      // 1. Synchronize Pending Form IV Inspection Records
      // =======================================================================
      final pendingInspections = await _formIvDao.getPendingInspections();

      if (pendingInspections.isNotEmpty) {
        final syncBatchId = _uuid.v4();

        final checklistsJson = pendingInspections.map((record) {
          return {
            'record_id': record.id,
            'location_id': _ensureValidUuid(record.locationId),
            if (record.roofBoltTorqueNm != null)
              'roof_bolt_torque_nm': record.roofBoltTorqueNm,
            if (record.airVelocityMPerMin != null)
              'air_velocity_m_per_min': record.airVelocityMPerMin,
            if (record.gasCh4Percent != null)
              'gas_ch4_percent': record.gasCh4Percent,
            if (record.gasCoPpm != null)
              'gas_co_ppm': record.gasCoPpm,
            if (record.strataRemarks != null && record.strataRemarks!.isNotEmpty)
              'strata_remarks': record.strataRemarks,
            'is_geotagged_nfc': record.isGeotaggedNfc,
            'inspection_time': record.inspectionTime.toUtc().toIso8601String(),
          };
        }).toList();

        final batchPayload = {
          'sync_id': syncBatchId,
          'device_id': 'COALGUARD-FIELD-HANDHELD-01',
          'checklists': checklistsJson,
        };

        try {
          final response = await _apiClient.dio.post(
            '/sync/batch',
            data: batchPayload,
            options: Options(
              headers: {
                'X-Idempotency-Key': syncBatchId,
              },
            ),
          );

          if (response.statusCode == 200 || response.statusCode == 201) {
            final ids = pendingInspections.map((r) => r.id).toList();
            await _formIvDao.markAsSynced(ids);
            syncedRecords = ids.length;
          }
        } on DioException catch (dioErr) {
          // Idempotent duplicate check: If backend already processed batch, acknowledge and mark synced
          if (dioErr.response?.statusCode == 409 ||
              (dioErr.response?.data is Map &&
                  dioErr.response?.data['status'] == 'DUPLICATE_ACKNOWLEDGED')) {
            final ids = pendingInspections.map((r) => r.id).toList();
            await _formIvDao.markAsSynced(ids);
            syncedRecords = ids.length;
          } else {
            rethrow;
          }
        }
      }

      // =======================================================================
      // 2. Synchronize Pending WebP Photographic Evidence Chunks
      // =======================================================================
      syncedMedia = await _syncPendingMedia();

      return SyncResult(
        success: true,
        recordsSynced: syncedRecords,
        mediaFilesSynced: syncedMedia,
        message: 'Synchronized $syncedRecords audits and $syncedMedia evidence files.',
      );
    } catch (e) {
      return SyncResult(
        success: false,
        recordsSynced: syncedRecords,
        mediaFilesSynced: syncedMedia,
        message: 'Sync interrupted: $e',
      );
    } finally {
      _isSyncing = false;
    }
  }

  /// Streams pending WebP evidence photos in 512KB binary chunks
  Future<int> _syncPendingMedia() async {
    final db = await _dbService.database;
    final List<Map<String, dynamic>> pendingMedia = await db.query(
      DbConstants.inspectionMediaTable,
      where: 'sync_status = ?',
      whereArgs: [DbConstants.statusPending],
    );

    int uploadedCount = 0;
    const chunkSize = 524288; // 512 KB standard chunk

    for (final media in pendingMedia) {
      final mediaId = media['id'] as String;
      final inspectionId = media['inspection_id'] as String;
      final filePath = media['file_path'] as String;

      final file = File(filePath);
      if (!await file.exists()) {
        continue;
      }

      try {
        final fileBytes = await file.readAsBytes();
        final fileSize = fileBytes.length;
        final totalChunks = (fileSize / chunkSize).ceil().clamp(1, 9999);
        final fileName = p.basename(filePath);

        // 1. Initialize Resumable Upload Session
        final initResponse = await _apiClient.dio.post(
          '/sync/upload-evidence/init',
          data: {
            'file_name': fileName,
            'total_chunks': totalChunks,
            'file_size_bytes': fileSize,
            'inspection_id': _ensureValidUuid(inspectionId),
          },
        );

        if (initResponse.statusCode == 201 && initResponse.data != null) {
          final uploadToken = initResponse.data['upload_token'] as String;

          // 2. Transmit Binary Chunks
          for (int chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            final start = chunkIndex * chunkSize;
            final end = (start + chunkSize < fileSize) ? start + chunkSize : fileSize;
            final chunkData = fileBytes.sublist(start, end);

            await _apiClient.dio.put(
              '/sync/upload-evidence/$uploadToken/chunk',
              queryParameters: {'chunk_index': chunkIndex},
              data: Stream.fromIterable([chunkData]),
              options: Options(
                headers: {
                  'Content-Type': 'application/octet-stream',
                  'Content-Length': chunkData.length,
                },
              ),
            );
          }

          // 3. Mark Media As Synced in SQLite
          await db.update(
            DbConstants.inspectionMediaTable,
            {'sync_status': DbConstants.statusSynced},
            where: 'id = ?',
            whereArgs: [mediaId],
          );
          uploadedCount++;
        }
      } catch (e) {
        debugPrint('Media chunk upload failed for $filePath: $e');
      }
    }

    return uploadedCount;
  }

  /// Utility ensuring string matches standard UUID v4 format or generates deterministic UUID
  String _ensureValidUuid(String raw) {
    try {
      // Check if string is already valid UUID
      if (RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
          .hasMatch(raw)) {
        return raw;
      }
      return Uuid.parse(raw).toString();
    } catch (_) {
      // Deterministically hash non-uuid location tags like 'LOC-SEC9-W4' into valid UUID
      return _uuid.v5(Uuid.NAMESPACE_URL, raw);
    }
  }
}
