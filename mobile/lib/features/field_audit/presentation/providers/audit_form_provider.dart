import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/constants/db_constants.dart';
import '../../../../core/storage/local_db_service.dart';
import '../../../../core/utils/media_compressor.dart';
import '../../data/local/form_iv_dao.dart';
import '../../data/models/form_iv_local_model.dart';
import 'sync_provider.dart';

class AuditFormState {
  final String locationId;
  final bool isGeotaggedNfc;
  final double? roofBoltTorque;
  final double? airVelocity;
  final double? gasCh4;
  final double? gasCo;
  final String strataRemarks;
  final List<String> attachedPhotoPaths;
  final bool isSaving;
  final String? errorMessage;
  final String? successMessage;

  const AuditFormState({
    this.locationId = 'LOC-SEC9-INCLINE-04',
    this.isGeotaggedNfc = false,
    this.roofBoltTorque,
    this.airVelocity,
    this.gasCh4,
    this.gasCo,
    this.strataRemarks = '',
    this.attachedPhotoPaths = const [],
    this.isSaving = false,
    this.errorMessage,
    this.successMessage,
  });

  AuditFormState copyWith({
    String? locationId,
    bool? isGeotaggedNfc,
    double? roofBoltTorque,
    double? airVelocity,
    double? gasCh4,
    double? gasCo,
    String? strataRemarks,
    List<String>? attachedPhotoPaths,
    bool? isSaving,
    String? errorMessage,
    String? successMessage,
  }) {
    return AuditFormState(
      locationId: locationId ?? this.locationId,
      isGeotaggedNfc: isGeotaggedNfc ?? this.isGeotaggedNfc,
      roofBoltTorque: roofBoltTorque ?? this.roofBoltTorque,
      airVelocity: airVelocity ?? this.airVelocity,
      gasCh4: gasCh4 ?? this.gasCh4,
      gasCo: gasCo ?? this.gasCo,
      strataRemarks: strataRemarks ?? this.strataRemarks,
      attachedPhotoPaths: attachedPhotoPaths ?? this.attachedPhotoPaths,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }
}

class AuditFormNotifier extends StateNotifier<AuditFormState> {
  final FormIvDao _formIvDao;
  final LocalDbService _dbService;
  final Ref _ref;
  static const _uuid = Uuid();

  AuditFormNotifier(this._formIvDao, this._dbService, this._ref)
      : super(const AuditFormState());

  void setLocation(String locationId, bool isNfc) {
    state = state.copyWith(locationId: locationId, isGeotaggedNfc: isNfc);
  }

  void setRoofBoltTorque(double? value) {
    state = state.copyWith(roofBoltTorque: value);
  }

  void setAirVelocity(double? value) {
    state = state.copyWith(airVelocity: value);
  }

  void setGasCh4(double? value) {
    state = state.copyWith(gasCh4: value);
  }

  void setGasCo(double? value) {
    state = state.copyWith(gasCo: value);
  }

  void setStrataRemarks(String value) {
    state = state.copyWith(strataRemarks: value);
  }

  Future<void> attachPhoto(String rawPath) async {
    try {
      final webpPath = await MediaCompressor.compressToWebP(rawPath);
      final updatedList = List<String>.from(state.attachedPhotoPaths)..add(webpPath);
      state = state.copyWith(attachedPhotoPaths: updatedList);
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to compress photo: $e');
    }
  }

  void removePhoto(int index) {
    if (index >= 0 && index < state.attachedPhotoPaths.length) {
      final updatedList = List<String>.from(state.attachedPhotoPaths)..removeAt(index);
      state = state.copyWith(attachedPhotoPaths: updatedList);
    }
  }

  Future<bool> saveAudit({required String inspectorId}) async {
    if (state.locationId.isEmpty) {
      state = state.copyWith(errorMessage: 'Please scan or specify underground location.');
      return false;
    }

    state = state.copyWith(isSaving: true, errorMessage: null);

    try {
      final inspectionId = _uuid.v4();
      final syncId = _uuid.v4();
      final now = DateTime.now();

      final record = FormIvLocalModel(
        id: inspectionId,
        syncId: syncId,
        inspectorId: inspectorId,
        locationId: state.locationId,
        roofBoltTorqueNm: state.roofBoltTorque,
        airVelocityMPerMin: state.airVelocity,
        gasCh4Percent: state.gasCh4,
        gasCoPpm: state.gasCo,
        strataRemarks: state.strataRemarks,
        isGeotaggedNfc: state.isGeotaggedNfc,
        inspectionTime: now,
        syncStatus: DbConstants.statusPending,
        createdAt: now,
      );

      // 1. Insert Form IV Record into SQLite
      await _formIvDao.insertInspection(record);

      // 2. Insert Media attachments into SQLite Media Queue
      final db = await _dbService.database;
      for (final photoPath in state.attachedPhotoPaths) {
        await db.insert(
          DbConstants.inspectionMediaTable,
          {
            'id': _uuid.v4(),
            'inspection_id': inspectionId,
            'file_path': photoPath,
            'mime_type': 'image/webp',
            'sync_status': DbConstants.statusPending,
            'created_at': now.toIso8601String(),
          },
        );
      }

      // 3. Invalidate sync and audit counters
      _ref.invalidate(syncQueueProvider);

      // 4. Reset form state
      state = const AuditFormState(
        successMessage: 'Statutory Form IV shift audit queued locally for sync.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        errorMessage: 'Failed to record audit to local SQLite: $e',
      );
      return false;
    }
  }
}

final auditFormProvider =
    StateNotifierProvider.autoDispose<AuditFormNotifier, AuditFormState>((ref) {
  final dao = FormIvDao();
  final dbService = LocalDbService.instance;
  return AuditFormNotifier(dao, dbService, ref);
});
