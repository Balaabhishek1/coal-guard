import 'package:flutter_test/flutter_test.dart';
import 'package:coal_guard_mobile/core/config/app_config.dart';
import 'package:coal_guard_mobile/features/field_audit/domain/models/form_iv_checklist.dart';

void main() {
  group('FormIVChecklist Statutory Safety Evaluators', () {
    test('accurately triggers Methane hazard alarms under CMR 2017 Reg 153', () {
      final safeEntry = FormIVChecklist(
        locationId: 'LOC-FACE-01',
        gasCh4Percent: 0.65,
        inspectionTime: DateTime.now(),
      );
      expect(safeEntry.isMethaneWarning, isFalse);
      expect(safeEntry.isMethaneCritical, isFalse);

      final warningEntry = FormIVChecklist(
        locationId: 'LOC-FACE-02',
        gasCh4Percent: 1.05,
        inspectionTime: DateTime.now(),
      );
      expect(warningEntry.isMethaneWarning, isTrue);
      expect(warningEntry.isMethaneCritical, isFalse);

      final criticalTripEntry = FormIVChecklist(
        locationId: 'LOC-FACE-03',
        gasCh4Percent: 1.30,
        inspectionTime: DateTime.now(),
      );
      expect(criticalTripEntry.isMethaneWarning, isTrue);
      expect(criticalTripEntry.isMethaneCritical, isTrue);
    });

    test('accurately detects Carbon Monoxide spontaneous heating', () {
      final normalCo = FormIVChecklist(
        locationId: 'LOC-RETURN-01',
        gasCoPpm: 12.0,
        inspectionTime: DateTime.now(),
      );
      expect(normalCo.isCoWarning, isFalse);
      expect(normalCo.isCoCritical, isFalse);

      final elevatedCo = FormIVChecklist(
        locationId: 'LOC-SEAL-02',
        gasCoPpm: 28.0,
        inspectionTime: DateTime.now(),
      );
      expect(elevatedCo.isCoWarning, isTrue);
      expect(elevatedCo.isCoCritical, isFalse);

      final criticalHeatingCo = FormIVChecklist(
        locationId: 'LOC-GOAF-03',
        gasCoPpm: 55.0,
        inspectionTime: DateTime.now(),
      );
      expect(criticalHeatingCo.isCoWarning, isTrue);
      expect(criticalHeatingCo.isCoCritical, isTrue);
    });

    test('identifies ventilation deficiencies and roof-bolt torque non-compliance', () {
      final deficientAir = FormIVChecklist(
        locationId: 'LOC-FACE-04',
        airVelocityMPerMin: 12.0, // Baseline: >= 15.0 m/min
        roofBoltTorqueNm: 70.0, // Baseline: >= 80.0 Nm
        inspectionTime: DateTime.now(),
      );
      expect(deficientAir.isAirVelocityDeficient, isTrue);
      expect(deficientAir.isRoofBoltUnderTorqued, isTrue);

      final compliantAir = FormIVChecklist(
        locationId: 'LOC-FACE-05',
        airVelocityMPerMin: 22.0,
        roofBoltTorqueNm: 95.0,
        inspectionTime: DateTime.now(),
      );
      expect(compliantAir.isAirVelocityDeficient, isFalse);
      expect(compliantAir.isRoofBoltUnderTorqued, isFalse);
    });
  });

  group('Sync Batch Payload Contract Verification', () {
    test('serializes to backend FormIVChecklistEntry schema format', () {
      final time = DateTime.utc(2026, 9, 20, 10, 30, 0);

      final checklist = FormIVChecklist(
        recordId: 'rec_uuid_001',
        locationId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        roofBoltTorqueNm: 105.0,
        airVelocityMPerMin: 24.5,
        gasCh4Percent: 0.35,
        gasCoPpm: 6.0,
        strataRemarks: '4 bolts tightened at 1.2m intervals. Strata sound.',
        isGeotaggedNfc: true,
        inspectionTime: time,
      );

      final json = checklist.toJson();

      expect(json['record_id'], 'rec_uuid_001');
      expect(json['location_id'], 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
      expect(json['roof_bolt_torque_nm'], 105.0);
      expect(json['air_velocity_m_per_min'], 24.5);
      expect(json['gas_ch4_percent'], 0.35);
      expect(json['gas_co_ppm'], 6.0);
      expect(json['strata_remarks'], contains('Strata sound'));
      expect(json['is_geotagged_nfc'], isTrue);
      expect(json['inspection_time'], '2026-09-20T10:30:00.000Z');
    });
  });
}
