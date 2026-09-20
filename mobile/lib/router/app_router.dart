import 'package:go_router/go_router.dart';
import '../features/auth/presentation/screens/offline_login_screen.dart';
import '../features/field_audit/presentation/screens/field_inspector_home_screen.dart';
import '../features/field_audit/presentation/screens/form_iv_audit_screen.dart';
import '../features/field_audit/presentation/screens/sync_status_screen.dart';

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
    GoRoute(
      path: '/audit/form-iv',
      name: 'form-iv-audit',
      builder: (context, state) => const FormIvAuditScreen(),
    ),
    GoRoute(
      path: '/sync-status',
      name: 'sync-status',
      builder: (context, state) => const SyncStatusScreen(),
    ),
  ],
);
