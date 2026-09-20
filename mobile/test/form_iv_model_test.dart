import 'package:flutter_test/flutter_test.dart';
import 'package:coal_guard_mobile/core/config/app_config.dart';
import 'package:coal_guard_mobile/core/constants/db_constants.dart';
import 'package:coal_guard_mobile/features/field_audit/data/models/form_iv_local_model.dart';

void main() {
  group('AppConfig Statutory Limits', () {
    test('enforces DGMS CMR-2017 gas and ventilation baselines', () {
      expect(AppConfig.maxCh4WarningPercent, 1.0);
      expect(AppConfig.maxCh4CriticalPercent, 1.25);
      expect(AppConfig.maxCoCriticalPpm, 50.0);
      expect(AppConfig.minAirVelocityMPerMin, 15.0);
      expect(AppConfig.minRoofBoltTorqueNm, 80.0);
      expect(AppConfig.maxContinuousShiftHours, 8.0);
    });
  });

  group('DbConstants Schema Definitions', () {
    test('defines required offline tables and indices', () {
      expect(DbConstants.offlineUsersTable, 'offline_users');
      expect(DbConstants.formIvInspectionsTable, 'local_form_iv_inspections');
      expect(DbConstants.inspectionMediaTable, 'local_inspection_media');
      expect(DbConstants.statusPending, 'PENDING');
      expect(DbConstants.statusSynced, 'SYNCED');

      expect(DbConstants.createOfflineUsersTableSql.contains('offline_users'), isTrue);
      expect(DbConstants.createFormIvInspectionsTableSql.contains('roof_bolt_torque_nm'), isTrue);
      expect(DbConstants.createInspectionMediaTableSql.contains('FOREIGN KEY'), isTrue);
    });
  });

  group('FormIvLocalModel Serialization', () {
    final now = DateTime.now();

    test('serializes to SQLite Map correctly', () {
      final model = FormIvLocalModel(
        id: 'audit_001',
        syncId: 'sync_abc_123',
        inspectorId: 'usr_overman_01',
        locationId: 'loc_incline_4',
        roofBoltTorqueNm: 85.5,
        airVelocityMPerMin: 18.2,
        gasCh4Percent: 0.45,
        gasCoPpm: 12.0,
        strataRemarks: 'No observable roof sagging in Gallery 4 East',
        isGeotaggedNfc: true,
        inspectionTime: now,
        syncStatus: 'PENDING',
        createdAt: now,
      );

      final map = model.toMap();

      expect(map['id'], 'audit_001');
      expect(map['sync_id'], 'sync_abc_123');
      expect(map['is_geotagged_nfc'], 1);
      expect(map['roof_bolt_torque_nm'], 85.5);
      expect(map['gas_ch4_percent'], 0.45);
      expect(map['sync_status'], 'PENDING');
    });

    test('deserializes from SQLite Map cleanly', () {
      final map = {
        'id': 'audit_002',
        'sync_id': 'sync_xyz_789',
        'inspector_id': 'usr_sirdar_02',
        'location_id': 'loc_face_9',
        'roof_bolt_torque_nm': 92.0,
        'air_velocity_m_per_min': 22.0,
        'gas_ch4_percent': 0.80,
        'gas_co_ppm': 15.0,
        'strata_remarks': 'Spalling observed along South Rib',
        'is_geotagged_nfc': 0,
        'inspection_time': now.toIso8601String(),
        'sync_status': 'SYNCED',
        'created_at': now.toIso8601String(),
      };

      final model = FormIvLocalModel.fromMap(map);

      expect(model.id, 'audit_002');
      expect(model.isGeotaggedNfc, isFalse);
      expect(model.roofBoltTorqueNm, 92.0);
      expect(model.gasCh4Percent, 0.80);
      expect(model.syncStatus, 'SYNCED');
    });

    test('copyWith updates specific attributes immutably', () {
      final original = FormIvLocalModel(
        id: 'audit_003',
        syncId: 'sync_003',
        inspectorId: 'usr_03',
        locationId: 'loc_03',
        inspectionTime: now,
        syncStatus: 'PENDING',
        createdAt: now,
      );

      final updated = original.copyWith(syncStatus: 'SYNCED', roofBoltTorqueNm: 88.0);

      expect(updated.id, 'audit_003');
      expect(updated.syncStatus, 'SYNCED');
      expect(updated.roofBoltTorqueNm, 88.0);
      expect(original.syncStatus, 'PENDING');
    });
  });
}
