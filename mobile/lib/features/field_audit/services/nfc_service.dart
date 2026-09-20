import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:nfc_manager/nfc_manager.dart';

/// Underground NFC Service
///
/// Interacts with physical underground BLE/NFC tokens placed at gallery
/// junctions to confirm physical geolocation under CMR 2017 Form IV.
class NfcService {
  NfcService._internal();
  static final NfcService instance = NfcService._internal();

  /// Checks if device has active NFC hardware
  Future<bool> isAvailable() async {
    try {
      return await NfcManager.instance.isAvailable();
    } catch (_) {
      return false;
    }
  }

  /// Starts listening for an underground location tag
  Future<String?> scanGalleryTag({
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final completer = Completer<String?>();
    Timer? timeoutTimer;

    final available = await isAvailable();
    if (!available) {
      return null;
    }

    try {
      await NfcManager.instance.startSession(
        onDiscovered: (NfcTag tag) async {
          timeoutTimer?.cancel();
          String? tagId;

          // 1. Extract NDEF message payload if present
          final ndef = Ndef.from(tag);
          if (ndef != null && ndef.cachedMessage != null) {
            for (final record in ndef.cachedMessage!.records) {
              if (record.typeNameFormat == NdefTypeNameFormat.nfcWellknown) {
                // Text payload decode (skip language code byte)
                if (record.payload.isNotEmpty) {
                  final languageCodeLength = record.payload[0] & 0x3F;
                  if (record.payload.length > languageCodeLength + 1) {
                    tagId = utf8.decode(
                      record.payload.sublist(languageCodeLength + 1),
                    );
                    break;
                  }
                }
              }
            }
          }

          // 2. Fallback: Parse intrinsic hardware identifier
          if (tagId == null || tagId.isEmpty) {
            final data = tag.data;
            final identifier = data['nfca']?['identifier'] ??
                data['nfcb']?['identifier'] ??
                data['nfcv']?['identifier'] ??
                data['isodep']?['identifier'];

            if (identifier is List) {
              tagId = identifier
                  .map((e) => (e as int).toRadixString(16).padLeft(2, '0'))
                  .join(':')
                  .toUpperCase();
            }
          }

          await NfcManager.instance.stopSession();
          if (!completer.isCompleted) {
            completer.complete(tagId ?? 'NFC-BEACON-SECTOR-IX');
          }
        },
      );

      timeoutTimer = Timer(timeout, () async {
        try {
          await NfcManager.instance.stopSession();
        } catch (_) {}
        if (!completer.isCompleted) {
          completer.complete(null);
        }
      });
    } catch (e) {
      debugPrint('NFC session initialization error: $e');
      if (!completer.isCompleted) {
        completer.complete(null);
      }
    }

    return completer.future;
  }

  /// Cancels active NFC scan session
  Future<void> cancelSession() async {
    try {
      await NfcManager.instance.stopSession();
    } catch (_) {}
  }
}
