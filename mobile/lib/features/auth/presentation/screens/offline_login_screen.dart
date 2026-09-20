import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

/// Industrial Offline Login Screen
///
/// Supports online credential synchronization at surface Wi-Fi
/// and instant cached authentication underground without signal.
class OfflineLoginScreen extends ConsumerStatefulWidget {
  const OfflineLoginScreen({super.key});

  @override
  ConsumerState<OfflineLoginScreen> createState() => _OfflineLoginScreenState();
}

class _OfflineLoginScreenState extends ConsumerState<OfflineLoginScreen> {
  final _identifierController = TextEditingController(text: 'overman@coalguard.in');
  final _passwordController = TextEditingController(text: 'OvermanSecure2026!');
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _selectPreset(String username, String password) {
    setState(() {
      _identifierController.text = username;
      _passwordController.text = password;
    });
  }

  void _simulateRfidTap() {
    setState(() {
      _identifierController.text = 'RFID-OM-9924';
      _passwordController.text = 'OvermanSecure2026!';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('NFC/RFID Card Read: RFID-OM-9924 (Overman Sirdar)'),
        backgroundColor: AppTheme.primary,
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter credential identifier and statutory PIN.'),
          backgroundColor: AppTheme.danger,
        ),
      );
      return;
    }

    final success = await ref.read(authProvider.notifier).login(
          identifier: identifier,
          passphrase: password,
        );

    if (success && mounted) {
      final authState = ref.read(authProvider);
      final modeNotice = authState.isOfflineMode
          ? 'Authenticated in Underground Offline Mode (Cached)'
          : 'Authenticated Online with Surface Gateway';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(modeNotice),
          backgroundColor: authState.isOfflineMode ? AppTheme.warning : AppTheme.success,
        ),
      );

      context.go('/inspector-home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // App Brand & Shield Icon
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.border, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          LucideIcons.shieldCheck,
                          color: AppTheme.primary,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Title & Colliery Subtitle
                  const Text(
                    'CoalGuard Mobile',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Digital CMR 2017 Form IV Field Inspector',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Offline Mode Readiness Card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.success,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Offline SQLite Engine Active • Underground Ready',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const Icon(
                          LucideIcons.database,
                          size: 14,
                          color: AppTheme.textMuted,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Role Presets
                  const Text(
                    'Operational Role Preset',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMuted,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildPresetChip(
                        label: 'Overman / Sirdar',
                        username: 'overman@coalguard.in',
                        password: 'OvermanSecure2026!',
                      ),
                      _buildPresetChip(
                        label: 'Safety Officer',
                        username: 'safety@coalguard.in',
                        password: 'SafetyOfficer2026!',
                      ),
                      _buildPresetChip(
                        label: 'Mine Manager',
                        username: 'manager@coalguard.in',
                        password: 'ManagerSecret2026!',
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Input: Credential / RFID
                  TextField(
                    controller: _identifierController,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: InputDecoration(
                      labelText: 'Credential / RFID / Email',
                      prefixIcon: const Icon(LucideIcons.user, size: 18, color: AppTheme.textMuted),
                      suffixIcon: IconButton(
                        icon: const Icon(LucideIcons.nfc, size: 18, color: AppTheme.primary),
                        tooltip: 'Simulate RFID Tap',
                        onPressed: _simulateRfidTap,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Input: Password / PIN
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: InputDecoration(
                      labelText: 'Statutory Passphrase / PIN',
                      prefixIcon: const Icon(LucideIcons.lock, size: 18, color: AppTheme.textMuted),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                          size: 18,
                          color: AppTheme.textMuted,
                        ),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Error Display
                  if (authState.errorMessage != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.danger.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.danger.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.alertTriangle, size: 16, color: AppTheme.danger),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              authState.errorMessage!,
                              style: const TextStyle(fontSize: 12, color: AppTheme.danger),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Login Action Button
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleLogin,
                    child: authState.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                            ),
                          )
                        : const Text('Sign In to Inspection Console'),
                  ),
                  const SizedBox(height: 20),

                  // Statutory Footer
                  const Text(
                    'DGMS CMR-2017 Form IV Statutory Logging Engine\nSHA-256 Audit Anchor • Offline First Architecture',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      color: AppTheme.textMuted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPresetChip({
    required String label,
    required String username,
    required String password,
  }) {
    final isSelected = _identifierController.text == username;
    return InkWell(
      onTap: () => _selectPreset(username, password),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withOpacity(0.15) : AppTheme.surfaceHigh,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.border,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}
