import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/db_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/local_db_service.dart';
import '../../../../core/storage/secure_storage_service.dart';

/// Authentication State
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? errorMessage;
  final String? userId;
  final String? username;
  final String? fullName;
  final String? role;
  final bool isOfflineMode;
  final String? token;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.errorMessage,
    this.userId,
    this.username,
    this.fullName,
    this.role,
    this.isOfflineMode = false,
    this.token,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? errorMessage,
    String? userId,
    String? username,
    String? fullName,
    String? role,
    bool? isOfflineMode,
    String? token,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      role: role ?? this.role,
      isOfflineMode: isOfflineMode ?? this.isOfflineMode,
      token: token ?? this.token,
    );
  }
}

/// StateNotifier managing dual online/offline authentication workflows
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final SecureStorageService _secureStorage;
  final LocalDbService _dbService;

  AuthNotifier({
    required ApiClient apiClient,
    required SecureStorageService secureStorage,
    required LocalDbService dbService,
  })  : _apiClient = apiClient,
        _secureStorage = secureStorage,
        _dbService = dbService,
        super(const AuthState()) {
    checkExistingAuth();
  }

  /// Initializes session state from secure keystore
  Future<void> checkExistingAuth() async {
    final token = await _secureStorage.getToken();
    final userId = await _secureStorage.getUserId();
    final username = await _secureStorage.getUsername();
    final role = await _secureStorage.getUserRole();

    if (token != null && token.isNotEmpty) {
      state = state.copyWith(
        isAuthenticated: true,
        token: token,
        userId: userId,
        username: username,
        role: role,
        isOfflineMode: false,
      );
    }
  }

  /// Hashes passphrases to SHA-256 for local offline credential matching
  String _hashPassphrase(String passphrase) {
    final bytes = utf8.encode(passphrase);
    return sha256.convert(bytes).toString();
  }

  /// Authenticates online against FastAPI, falling back to local SQLite credentials underground
  Future<bool> login({
    required String identifier,
    required String passphrase,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    final hashedPassword = _hashPassphrase(passphrase);

    // 1. Attempt Online Authentication
    try {
      final response = await _apiClient.dio.post(
        '/auth/login',
        data: {
          'username': identifier,
          'password': passphrase,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final token = data['access_token'] as String;
        final user = data['user'] as Map<String, dynamic>? ?? {};

        final userId = user['id']?.toString() ?? 'usr_${DateTime.now().millisecondsSinceEpoch}';
        final role = user['role']?.toString() ?? 'OVERMAN';
        final fullName = user['full_name']?.toString() ?? identifier;
        final rfidTag = user['rfid_tag']?.toString();

        // Save to Secure Keystore
        await _secureStorage.saveToken(token);
        await _secureStorage.saveUserId(userId);
        await _secureStorage.saveUsername(identifier);
        await _secureStorage.saveUserRole(role);
        await _secureStorage.saveOfflineAuthHash(hashedPassword);

        // Cache credentials into SQLite for offline underground use
        final db = await _dbService.database;
        await db.insert(
          DbConstants.offlineUsersTable,
          {
            'id': userId,
            'rfid_tag': rfidTag,
            'username': identifier,
            'full_name': fullName,
            'role': role,
            'hashed_password': hashedPassword,
            'last_sync_time': DateTime.now().toIso8601String(),
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );

        state = state.copyWith(
          isAuthenticated: true,
          isLoading: false,
          userId: userId,
          username: identifier,
          fullName: fullName,
          role: role,
          token: token,
          isOfflineMode: false,
        );
        return true;
      }
    } on DioException catch (dioErr) {
      // Network unreachable, connection refused, or timed out underground
      final isNetworkError = dioErr.type == DioExceptionType.connectionTimeout ||
          dioErr.type == DioExceptionType.receiveTimeout ||
          dioErr.type == DioExceptionType.connectionError;

      if (!isNetworkError && dioErr.response?.statusCode == 401) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Invalid colliery credentials or statutory PIN.',
        );
        return false;
      }
    } catch (_) {
      // Fall through to offline SQLite validation
    }

    // 2. Offline Underground Authentication via Local SQLite
    try {
      final db = await _dbService.database;
      final List<Map<String, dynamic>> results = await db.query(
        DbConstants.offlineUsersTable,
        where: 'username = ? OR rfid_tag = ?',
        whereArgs: [identifier, identifier],
        limit: 1,
      );

      if (results.isNotEmpty) {
        final cachedUser = results.first;
        final cachedHash = cachedUser['hashed_password'] as String;

        if (cachedHash == hashedPassword) {
          final userId = cachedUser['id'] as String;
          final role = cachedUser['role'] as String;
          final fullName = cachedUser['full_name'] as String;

          await _secureStorage.saveUserId(userId);
          await _secureStorage.saveUsername(identifier);
          await _secureStorage.saveUserRole(role);

          state = state.copyWith(
            isAuthenticated: true,
            isLoading: false,
            userId: userId,
            username: identifier,
            fullName: fullName,
            role: role,
            isOfflineMode: true,
          );
          return true;
        } else {
          state = state.copyWith(
            isLoading: false,
            errorMessage: 'Incorrect PIN for cached offline credentials.',
          );
          return false;
        }
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage:
              'No offline credential cached for "$identifier". Login once at the surface gateway first.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Local database authentication failure: $e',
      );
      return false;
    }
  }

  /// Instant RFID Tap for Field Inspectors
  Future<bool> authenticateWithRfid(String rfidTag) async {
    return await login(identifier: rfidTag, passphrase: 'default_colliery_pin');
  }

  /// Terminates active session and evicts access tokens
  Future<void> logout() async {
    await _secureStorage.clearSession();
    state = const AuthState();
  }
}

// Providers
final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final localDbServiceProvider = Provider<LocalDbService>((ref) {
  return LocalDbService.instance;
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(secureStorage: storage);
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    apiClient: ref.watch(apiClientProvider),
    secureStorage: ref.watch(secureStorageProvider),
    dbService: ref.watch(localDbServiceProvider),
  );
});
