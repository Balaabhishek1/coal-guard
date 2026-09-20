import 'package:go_router/go_router.dart';
import '../features/auth/presentation/screens/offline_login_screen.dart';
import '../features/field_audit/presentation/screens/field_inspector_home_screen.dart';

/// Declarative Navigation Router
final appRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const OfflineLoginScreen(),
    ),
    GoRoute(
      path: '/inspector-home',
      name: 'inspector-home',
      builder: (context, state) => const FieldInspectorHomeScreen(),
    ),
  ],
);
