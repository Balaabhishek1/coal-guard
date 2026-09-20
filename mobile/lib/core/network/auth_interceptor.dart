import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';

/// Authentication Interceptor
///
/// Injects stored JWT statutory bearer token into every outgoing HTTP request
/// and catches 401 Unauthorized responses to clear local credentials.
class AuthInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;

  AuthInterceptor({required SecureStorageService secureStorage})
      : _secureStorage = secureStorage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // Default JSON headers
    options.headers['Accept'] = 'application/json';
    if (options.data is! FormData) {
      options.headers['Content-Type'] = 'application/json';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      // Evict invalid session credentials
      _secureStorage.clearSession();
    }
    handler.next(err);
  }
}
