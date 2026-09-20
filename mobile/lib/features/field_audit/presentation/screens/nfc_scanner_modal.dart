import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../../services/nfc_service.dart';

/// Underground NFC Scanner BottomSheet Modal
///
/// Guides the Overman / Sirdar to scan physical NFC beacon markers
/// placed at mine galleries, with fallback to manual gallery tag entry.
class NfcScannerModal extends StatefulWidget {
  const NfcScannerModal({super.key});

  static Future<String?> show(BuildContext context) {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NfcScannerModal(),
    );
  }

  @override
  State<NfcScannerModal> createState() => _NfcScannerModalState();
}

class _NfcScannerModalState extends State<NfcScannerModal>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  final _manualTagController = TextEditingController();
  bool _isScanning = true;
  String _statusMessage = 'Hold device against gallery RFID/NFC beacon...';

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _startNfcScan();
  }

  @override
  void dispose() {
    _animController.dispose();
    _manualTagController.dispose();
    NfcService.instance.cancelSession();
    super.dispose();
  }

  Future<void> _startNfcScan() async {
    final scannedId = await NfcService.instance.scanGalleryTag();
    if (mounted) {
      if (scannedId != null) {
        Navigator.of(context).pop(scannedId);
      } else {
        setState(() {
          _isScanning = false;
          _statusMessage = 'NFC scan timed out or hardware unavailable.';
        });
      }
    }
  }

  void _submitManual() {
    final tag = _manualTagController.text.trim();
    if (tag.isNotEmpty) {
      Navigator.of(context).pop(tag);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: 24 + bottomInset,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(
          top: BorderSide(color: AppTheme.border, width: 1.5),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),

          // Title
          const Text(
            'Underground NFC Geolocation Tag',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _statusMessage,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 28),

          // Animated NFC Scanning Wave
          if (_isScanning)
            AnimatedBuilder(
              animation: _animController,
              builder: (context, child) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer Ring
                    Container(
                      width: 100 + (_animController.value * 30),
                      height: 100 + (_animController.value * 30),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.primary.withOpacity(1.0 - _animController.value),
                          width: 2,
                        ),
                      ),
                    ),
                    // Inner Circle
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceHigh,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.primary, width: 2),
                      ),
                      child: const Center(
                        child: Icon(
                          LucideIcons.nfc,
                          color: AppTheme.primary,
                          size: 36,
                        ),
                      ),
                    ),
                  ],
                );
              },
            )
          else
            const Icon(
              LucideIcons.alertCircle,
              color: AppTheme.warning,
              size: 54,
            ),
          const SizedBox(height: 28),

          // Manual Fallback Input
          TextField(
            controller: _manualTagController,
            style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'Enter gallery tag manually (e.g. LOC-SEC9-W4)',
              prefixIcon: const Icon(LucideIcons.mapPin, size: 16, color: AppTheme.textMuted),
              suffixIcon: IconButton(
                icon: const Icon(LucideIcons.check, size: 18, color: AppTheme.primary),
                onPressed: _submitManual,
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Simulation Button (for emulator / field test)
          OutlinedButton.icon(
            icon: const Icon(LucideIcons.radio, size: 16),
            label: const Text('Simulate Gallery Junction Tag Tap'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primary,
              side: const BorderSide(color: AppTheme.primary),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.of(context).pop('LOC-SEC9-INCLINE-04');
            },
          ),
        ],
      ),
    );
  }
}
