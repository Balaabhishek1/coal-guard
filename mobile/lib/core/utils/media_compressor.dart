import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path/path.dart' as p;
import 'package:uuid/uuid.dart';

/// Media Compressor Utility
///
/// Converts raw field camera photos into compressed WebP format
/// to minimize bandwidth overhead over colliery communication links.
class MediaCompressor {
  MediaCompressor._();

  static final _uuid = Uuid();

  /// Compresses a photo at [sourcePath] into WebP format at [quality] (default 80%).
  /// Returns the path to the compressed file.
  static Future<String> compressToWebP(
    String sourcePath, {
    int quality = 80,
    int minWidth = 1280,
    int minHeight = 720,
  }) async {
    final file = File(sourcePath);
    if (!await file.exists()) {
      throw FileNotFoundException('Source image does not exist: $sourcePath');
    }

    final dir = file.parent.path;
    final targetPath = p.join(
      dir,
      'cg_evidence_${_uuid.v4().substring(0, 8)}.webp',
    );

    try {
      final result = await FlutterImageCompress.compressAndGetFile(
        sourcePath,
        targetPath,
        format: CompressFormat.webp,
        quality: quality,
        minWidth: minWidth,
        minHeight: minHeight,
      );

      if (result != null) {
        return result.path;
      }
    } catch (_) {
      // Fallback: Return original path if compressor is unavailable
    }

    return sourcePath;
  }
}

class FileNotFoundException implements Exception {
  final String message;
  FileNotFoundException(this.message);

  @override
  String toString() => 'FileNotFoundException: $message';
}
