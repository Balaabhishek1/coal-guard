import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../storage/secure_storage_service.dart';
import 'auth_interceptor.dart';

/// API Client Gateway
///
/// High-performance Dio client configured with statutory headers,
/// short connect timeouts for offline detection, and bearer authorization.
class ApiClient {
  late final Dio dio;

  ApiClient({
    String? baseUrl,
    SecureStorageService? secureStorage,
  }) {
    final storage = secureStorage ?? SecureStorageService();

    final baseOptions = BaseOptions(
      baseUrl: baseUrl ?? AppConfig.defaultBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Accept': 'application/json',
        'X-Client-Platform': 'CoalGuard-Mobile-Field-Inspector',
      },
    );

    dio = Dio(baseOptions);

    // Attach Statutory JWT Authorization Interceptor
    dio.interceptors.add(AuthInterceptor(secureStorage: storage));
  }
}
