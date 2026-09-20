import '../../../../core/config/app_config.dart';

/// Form IV Checklist Domain Model
///
/// Encapsulates shift measurements, statutory validation thresholds,
/// and JSON payload serialization matching backend `FormIVChecklistEntry`.
class FormIVChecklist {
  final String? recordId;
  final String locationId;
  final double? roofBoltTorqueNm;
  final double? airVelocityMPerMin;
  final double? gasCh4Percent;
  final double? gasCoPpm;
  final String? strataRemarks;
  final bool isGeotaggedNfc;
  final DateTime inspectionTime;

  const FormIVChecklist({
    this.recordId,
    required this.locationId,
    this.roofBoltTorqueNm,
    this.airVelocityMPerMin,
    this.gasCh4Percent,
    this.gasCoPpm,
    this.strataRemarks,
    this.isGeotaggedNfc = false,
    required this.inspectionTime,
  });

  // Statutory Warning Evaluators
  bool get isMethaneCritical =>
      (gasCh4Percent ?? 0.0) >= AppConfig.maxCh4CriticalPercent;

  bool get isMethaneWarning =>
      (gasCh4Percent ?? 0.0) >= AppConfig.maxCh4WarningPercent;

  bool get isCoCritical =>
      (gasCoPpm ?? 0.0) >= AppConfig.maxCoCriticalPpm;

  bool get isCoWarning =>
      (gasCoPpm ?? 0.0) >= AppConfig.maxCoWarningPpm;

  bool get isAirVelocityDeficient =>
      (airVelocityMPerMin ?? AppConfig.minAirVelocityMPerMin) <
      AppConfig.minAirVelocityMPerMin;

  bool get isRoofBoltUnderTorqued =>
      (roofBoltTorqueNm ?? AppConfig.minRoofBoltTorqueNm) <
      AppConfig.minRoofBoltTorqueNm;

  Map<String, dynamic> toJson() {
    return {
      if (recordId != null) 'record_id': recordId,
      'location_id': locationId,
      if (roofBoltTorqueNm != null) 'roof_bolt_torque_nm': roofBoltTorqueNm,
      if (airVelocityMPerMin != null) 'air_velocity_m_per_min': airVelocityMPerMin,
      if (gasCh4Percent != null) 'gas_ch4_percent': gasCh4Percent,
      if (gasCoPpm != null) 'gas_co_ppm': gasCoPpm,
      if (strataRemarks != null && strataRemarks!.isNotEmpty)
        'strata_remarks': strataRemarks,
      'is_geotagged_nfc': isGeotaggedNfc,
      'inspection_time': inspectionTime.toUtc().toIso8601String(),
    };
  }
}
