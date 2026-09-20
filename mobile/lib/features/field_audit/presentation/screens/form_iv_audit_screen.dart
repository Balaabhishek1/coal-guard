import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/audit_form_provider.dart';
import 'nfc_scanner_modal.dart';

/// Digital CMR 2017 Form IV Shift Audit Screen
///
/// Enables Mining Sirdars & Overmen to record ventilation and strata metrics
/// with live statutory warnings, NFC token geovalidation, and WebP photo capture.
class FormIvAuditScreen extends ConsumerStatefulWidget {
  const FormIvAuditScreen({super.key});

  @override
  ConsumerState<FormIvAuditScreen> createState() => _FormIvAuditScreenState();
}

class _FormIvAuditScreenState extends ConsumerState<FormIvAuditScreen> {
  final _torqueController = TextEditingController();
  final _velocityController = TextEditingController();
  final _ch4Controller = TextEditingController();
  final _coController = TextEditingController();
  final _remarksController = TextEditingController();

  final _imagePicker = ImagePicker();

  @override
  void dispose() {
    _torqueController.dispose();
    _velocityController.dispose();
    _ch4Controller.dispose();
    _coController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final photo = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (photo != null) {
        await ref.read(auditFormProvider.notifier).attachPhoto(photo.path);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Camera error: $e'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
  }

  Future<void> _scanNfcTag() async {
    final scannedLocation = await NfcScannerModal.show(context);
    if (scannedLocation != null && mounted) {
      ref.read(auditFormProvider.notifier).setLocation(scannedLocation, true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC Geotag Verified: $scannedLocation'),
          backgroundColor: AppTheme.success,
        ),
      );
    }
  }

  Future<void> _submitAudit() async {
    final authState = ref.read(authProvider);
    final inspectorId = authState.userId ?? 'usr_overman_default';

    final success = await ref.read(auditFormProvider.notifier).saveAudit(
          inspectorId: inspectorId,
        );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Form IV inspection saved to local offline SQLite queue.'),
          backgroundColor: AppTheme.success,
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(auditFormProvider);

    final ch4Val = formState.gasCh4 ?? 0.0;
    final isCh4Critical = ch4Val >= AppConfig.maxCh4CriticalPercent;
    final isCh4Warning = ch4Val >= AppConfig.maxCh4WarningPercent;

    final coVal = formState.gasCo ?? 0.0;
    final isCoCritical = coVal >= AppConfig.maxCoCriticalPpm;
    final isCoWarning = coVal >= AppConfig.maxCoWarningPpm;

    final velVal = formState.airVelocity;
    final isVelDeficient = velVal != null && velVal < AppConfig.minAirVelocityMPerMin;

    final torqueVal = formState.roofBoltTorque;
    final isTorqueLow = torqueVal != null && torqueVal < AppConfig.minRoofBoltTorqueNm;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Digital CMR Form IV Audit'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.radio, size: 20, color: AppTheme.primary),
            tooltip: 'Scan Gallery NFC',
            onPressed: _scanNfcTag,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Gallery Location & NFC Tag Status
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: formState.isGeotaggedNfc
                          ? AppTheme.success.withOpacity(0.15)
                          : AppTheme.surfaceHigh,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      formState.isGeotaggedNfc ? LucideIcons.nfc : LucideIcons.mapPin,
                      color: formState.isGeotaggedNfc ? AppTheme.success : AppTheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Underground Location / Working Face',
                          style: TextStyle(fontSize: 10, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formState.locationId,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  OutlinedButton.icon(
                    icon: const Icon(LucideIcons.radio, size: 14),
                    label: Text(formState.isGeotaggedNfc ? 'Tagged' : 'Scan NFC'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor:
                          formState.isGeotaggedNfc ? AppTheme.success : AppTheme.primary,
                      side: BorderSide(
                        color: formState.isGeotaggedNfc ? AppTheme.success : AppTheme.primary,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                    onPressed: _scanNfcTag,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Section 1: Gas Telemetry & Statutory Ventilation
            const Text(
              'Atmospheric & Ventilation Measurements',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMuted,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                // Methane CH4
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _ch4Controller,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Methane (CH4 %)',
                          suffixText: '%',
                        ),
                        onChanged: (val) {
                          ref.read(auditFormProvider.notifier).setGasCh4(double.tryParse(val));
                        },
                      ),
                      if (isCh4Critical)
                        _buildWarningChip('CRITICAL: >= 1.25% Power Trip', AppTheme.danger)
                      else if (isCh4Warning)
                        _buildWarningChip('WARNING: >= 1.0%', AppTheme.warning),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Carbon Monoxide CO
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _coController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Carbon Monoxide',
                          suffixText: 'PPM',
                        ),
                        onChanged: (val) {
                          ref.read(auditFormProvider.notifier).setGasCo(double.tryParse(val));
                        },
                      ),
                      if (isCoCritical)
                        _buildWarningChip('CRITICAL: >= 50 PPM Heating', AppTheme.danger)
                      else if (isCoWarning)
                        _buildWarningChip('ELEVATED: >= 25 PPM', AppTheme.warning),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Air Velocity
            TextField(
              controller: _velocityController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Air Velocity (CMR 2017 Reg 153)',
                suffixText: 'm/min',
                prefixIcon: Icon(LucideIcons.wind, size: 18, color: AppTheme.textMuted),
              ),
              onChanged: (val) {
                ref.read(auditFormProvider.notifier).setAirVelocity(double.tryParse(val));
              },
            ),
            if (isVelDeficient)
              _buildWarningChip('Sub-standard ventilation (< 15 m/min)', AppTheme.danger),

            const SizedBox(height: 24),

            // Section 2: Strata Control & Mechanical Roof-Bolts
            const Text(
              'Strata Control & Support Interlocks',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMuted,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 10),

            TextField(
              controller: _torqueController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Mechanical Roof Bolt Torque',
                suffixText: 'Nm',
                prefixIcon: Icon(LucideIcons.hammer, size: 18, color: AppTheme.textMuted),
              ),
              onChanged: (val) {
                ref.read(auditFormProvider.notifier).setRoofBoltTorque(double.tryParse(val));
              },
            ),
            if (isTorqueLow)
              _buildWarningChip('Under-torqued bolt: Non-compliant (< 80 Nm)', AppTheme.danger),

            const SizedBox(height: 14),

            // Strata Remarks
            TextField(
              controller: _remarksController,
              maxLines: 3,
              style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Qualitative Strata Observations / Side Supports',
                hintText: 'Record rib spalling, roof sag, timber prop integrity, or water seepage...',
              ),
              onChanged: (val) {
                ref.read(auditFormProvider.notifier).setStrataRemarks(val);
              },
            ),
            const SizedBox(height: 24),

            // Section 3: Photographic Evidence (Compressed WebP)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'WebP Photographic Evidence',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textMuted,
                    letterSpacing: 0.3,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(LucideIcons.camera, size: 18, color: AppTheme.primary),
                      tooltip: 'Capture Camera Evidence',
                      onPressed: () => _pickPhoto(ImageSource.camera),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.image, size: 18, color: AppTheme.textSecondary),
                      tooltip: 'Select from Gallery',
                      onPressed: () => _pickPhoto(ImageSource.gallery),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Photo Previews
            if (formState.attachedPhotoPaths.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.cameraOff, size: 16, color: AppTheme.textMuted),
                    SizedBox(width: 8),
                    Text(
                      'No evidence photos attached. Tap camera icon above.',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              )
            else
              SizedBox(
                height: 90,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: formState.attachedPhotoPaths.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final path = formState.attachedPhotoPaths[index];
                    return Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.file(
                            File(path),
                            width: 90,
                            height: 90,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 90,
                              height: 90,
                              color: AppTheme.surfaceHigh,
                              child: const Icon(LucideIcons.fileImage, size: 24),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 2,
                          right: 2,
                          child: InkWell(
                            onTap: () {
                              ref.read(auditFormProvider.notifier).removePhoto(index);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Colors.black87,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.x, size: 12, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

            const SizedBox(height: 32),

            // Save Action Button
            ElevatedButton.icon(
              icon: const Icon(LucideIcons.hardDriveDownload, size: 18),
              label: formState.isSaving
                  ? const Text('Saving Offline Record...')
                  : const Text('Queue Offline Shift Audit in Local SQLite'),
              onPressed: formState.isSaving ? null : _submitAudit,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningChip(String text, Color color) {
    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.alertTriangle, size: 11, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              text,
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color),
            ),
          ),
        ],
      ),
    );
  }
}
