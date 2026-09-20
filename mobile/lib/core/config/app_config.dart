/// Application Configuration & Statutory Industrial Thresholds
///
/// Implements standard colliery environment baselines governed by
/// DGMS Coal Mines Regulations (CMR) 2017 & Mines Act 1952.
class AppConfig {
  AppConfig._();

  static const String appName = 'CoalGuard Field Inspector';
  static const String appVersion = '1.0.0';
  static const String buildNumber = '1';

  /// Primary Gateway URL for backend synchronization
  /// Use 10.0.2.2 for Android emulator host loopback, or LAN IP for physical device
  static const String defaultBaseUrl = String.fromEnvironment(
    'BACKEND_API_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );

  /// Aggressive network timeout (5 seconds) for underground offline mode detection
  static const Duration connectTimeout = Duration(seconds: 5);
  static const Duration receiveTimeout = Duration(seconds: 5);

  // ===========================================================================
  // Statutory Safety Parameters (DGMS CMR 2017)
  // ===========================================================================

  /// CMR 2017 Regulation 153: Maximum permissible inflammable gas CH4 threshold
  static const double maxCh4WarningPercent = 1.0;
  static const double maxCh4CriticalPercent = 1.25;

  /// CMR 2017 Spontaneous combustion heating threshold for CO
  static const double maxCoWarningPpm = 25.0;
  static const double maxCoCriticalPpm = 50.0;

  /// CMR 2017 Minimum ventilation air velocity in active return/intake airway
  static const double minAirVelocityMPerMin = 15.0;

  /// Strata Control & Monitoring Plan (SCAMP): Minimum mechanical bolt torque
  static const double minRoofBoltTorqueNm = 80.0;

  /// Mines Act 1952: Statutory maximum continuous shift limit
  static const double maxContinuousShiftHours = 8.0;
}
