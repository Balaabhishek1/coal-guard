import 'package:flutter/material.dart';

/// Industrial Theme System for CoalGuard Rugged Handhelds
///
/// Designed for low-light underground visibility, high-contrast statutory warnings,
/// and calm matte-obsidian surface ergonomics.
class AppTheme {
  AppTheme._();

  // Color Tokens
  static const Color background = Color(0xFF0C0D12);
  static const Color surface = Color(0xFF141620);
  static const Color surfaceHigh = Color(0xFF1B1D2A);
  static const Color cardColor = Color(0xFF161822);
  static const Color border = Color(0xFF242738);

  static const Color primary = Color(0xFFF59E0B); // Industrial Safety Amber
  static const Color primaryLight = Color(0xFFFBBF24);
  static const Color secondary = Color(0xFF3B82F6); // Statutory Cobalt
  static const Color success = Color(0xFF10B981); // Emerald Active/Pass
  static const Color warning = Color(0xFFF97316); // High Alert Orange
  static const Color danger = Color(0xFFEF4444); // Critical Violation Red

  static const Color textPrimary = Color(0xFFF3F4F6);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF6B7280);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: secondary,
        surface: surface,
        error: danger,
        onPrimary: Colors.black,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onError: Colors.white,
      ),
      cardTheme: CardTheme(
        color: cardColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceHigh,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: textMuted, fontSize: 14),
        labelStyle: const TextStyle(color: textSecondary, fontSize: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.black,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.2,
        ),
        iconTheme: IconThemeData(color: textPrimary),
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
