/// Local Model for DGMS CMR 2017 Form IV Shift Inspections
///
/// Encapsulates physical underground measurements (methane gas %, CO PPM,
/// roof-bolt torque Nm, air velocity m/min) with offline sync tracking.
class FormIvLocalModel {
  final String id;
  final String syncId;
  final String inspectorId;
  final String locationId;
  final double? roofBoltTorqueNm;
  final double? airVelocityMPerMin;
  final double? gasCh4Percent;
  final double? gasCoPpm;
  final String? strataRemarks;
  final bool isGeotaggedNfc;
  final DateTime inspectionTime;
  final String syncStatus;
  final DateTime createdAt;

  const FormIvLocalModel({
    required this.id,
    required this.syncId,
    required this.inspectorId,
    required this.locationId,
    this.roofBoltTorqueNm,
    this.airVelocityMPerMin,
    this.gasCh4Percent,
    this.gasCoPpm,
    this.strataRemarks,
    this.isGeotaggedNfc = false,
    required this.inspectionTime,
    this.syncStatus = 'PENDING',
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sync_id': syncId,
      'inspector_id': inspectorId,
      'location_id': locationId,
      'roof_bolt_torque_nm': roofBoltTorqueNm,
      'air_velocity_m_per_min': airVelocityMPerMin,
      'gas_ch4_percent': gasCh4Percent,
      'gas_co_ppm': gasCoPpm,
      'strata_remarks': strataRemarks,
      'is_geotagged_nfc': isGeotaggedNfc ? 1 : 0,
      'inspection_time': inspectionTime.toIso8601String(),
      'sync_status': syncStatus,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory FormIvLocalModel.fromMap(Map<String, dynamic> map) {
    return FormIvLocalModel(
      id: map['id'] as String,
      syncId: map['sync_id'] as String,
      inspectorId: map['inspector_id'] as String,
      locationId: map['location_id'] as String,
      roofBoltTorqueNm: (map['roof_bolt_torque_nm'] as num?)?.toDouble(),
      airVelocityMPerMin: (map['air_velocity_m_per_min'] as num?)?.toDouble(),
      gasCh4Percent: (map['gas_ch4_percent'] as num?)?.toDouble(),
      gasCoPpm: (map['gas_co_ppm'] as num?)?.toDouble(),
      strataRemarks: map['strata_remarks'] as String?,
      isGeotaggedNfc: (map['is_geotagged_nfc'] as int? ?? 0) == 1,
      inspectionTime: DateTime.parse(map['inspection_time'] as String),
      syncStatus: map['sync_status'] as String? ?? 'PENDING',
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  FormIvLocalModel copyWith({
    String? id,
    String? syncId,
    String? inspectorId,
    String? locationId,
    double? roofBoltTorqueNm,
    double? airVelocityMPerMin,
    double? gasCh4Percent,
    double? gasCoPpm,
    String? strataRemarks,
    bool? isGeotaggedNfc,
    DateTime? inspectionTime,
    String? syncStatus,
    DateTime? createdAt,
  }) {
    return FormIvLocalModel(
      id: id ?? this.id,
      syncId: syncId ?? this.syncId,
      inspectorId: inspectorId ?? this.inspectorId,
      locationId: locationId ?? this.locationId,
      roofBoltTorqueNm: roofBoltTorqueNm ?? this.roofBoltTorqueNm,
      airVelocityMPerMin: airVelocityMPerMin ?? this.airVelocityMPerMin,
      gasCh4Percent: gasCh4Percent ?? this.gasCh4Percent,
      gasCoPpm: gasCoPpm ?? this.gasCoPpm,
      strataRemarks: strataRemarks ?? this.strataRemarks,
      isGeotaggedNfc: isGeotaggedNfc ?? this.isGeotaggedNfc,
      inspectionTime: inspectionTime ?? this.inspectionTime,
      syncStatus: syncStatus ?? this.syncStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
