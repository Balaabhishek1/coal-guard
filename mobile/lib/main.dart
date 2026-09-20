import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/storage/local_db_service.dart';
import 'core/theme/app_theme.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Eagerly initialize SQLite database engine on startup
  try {
    await LocalDbService.instance.database;
  } catch (e) {
    debugPrint('Database eager initialization warning: $e');
  }

  runApp(
    const ProviderScope(
      child: CoalGuardMobileApp(),
    ),
  );
}

class CoalGuardMobileApp extends StatelessWidget {
  const CoalGuardMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'CoalGuard Field Inspector',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: appRouter,
    );
  }
}
