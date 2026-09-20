import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure Storage Service
///
/// Encrypted hardware-backed keystore wrapper for JWT statutory tokens,
/// user roles, and offline credential verification hashes.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(
                encryptedSharedPreferences: true,
              ),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  static const String _keyJwtToken = 'coalguard_jwt_token';
  static const String _keyUserRole = 'coalguard_user_role';
  static const String _keyUserId = 'coalguard_user_id';
  static const String _keyUsername = 'coalguard_username';
  static const String _keyOfflineAuthHash = 'coalguard_offline_auth_hash';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _keyJwtToken, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _keyJwtToken);
  }

  Future<void> saveUserRole(String role) async {
    await _storage.write(key: _keyUserRole, value: role);
  }

  Future<String?> getUserRole() async {
    return await _storage.read(key: _keyUserRole);
  }

  Future<void> saveUserId(String userId) async {
    await _storage.write(key: _keyUserId, value: userId);
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }

  Future<void> saveUsername(String username) async {
    await _storage.write(key: _keyUsername, value: username);
  }

  Future<String?> getUsername() async {
    return await _storage.read(key: _keyUsername);
  }

  Future<void> saveOfflineAuthHash(String hash) async {
    await _storage.write(key: _keyOfflineAuthHash, value: hash);
  }

  Future<String?> getOfflineAuthHash() async {
    return await _storage.read(key: _keyOfflineAuthHash);
  }

  Future<void> clearSession() async {
    await _storage.delete(key: _keyJwtToken);
    await _storage.delete(key: _keyUserRole);
    await _storage.delete(key: _keyUserId);
    await _storage.delete(key: _keyUsername);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
