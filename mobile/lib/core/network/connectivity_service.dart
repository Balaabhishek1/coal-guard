import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Network Connectivity Service
///
/// Monitors surface Wi-Fi and underground offline state transitions
/// to drive the autonomous background sync queue.
class ConnectivityService {
  final Connectivity _connectivity;

  ConnectivityService({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity();

  /// Broadcast stream indicating whether device has network reachability
  Stream<bool> get onConnectivityChanged {
    return _connectivity.onConnectivityChanged.map((results) {
      return _isOnlineFromResult(results);
    }).distinct();
  }

  /// Checks current network connectivity status
  Future<bool> isOnline() async {
    final results = await _connectivity.checkConnectivity();
    return _isOnlineFromResult(results);
  }

  /// Returns user-friendly connectivity label
  Future<String> getConnectivityType() async {
    final results = await _connectivity.checkConnectivity();
    if (results.contains(ConnectivityResult.wifi)) return 'Wi-Fi Surface Network';
    if (results.contains(ConnectivityResult.mobile)) return 'Cellular Network';
    if (results.contains(ConnectivityResult.ethernet)) return 'Colliery LAN';
    return 'Underground Offline';
  }

  bool _isOnlineFromResult(List<ConnectivityResult> results) {
    if (results.isEmpty) return false;
    return results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet);
  }
}
