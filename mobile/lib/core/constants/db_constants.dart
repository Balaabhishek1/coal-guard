/// Offline SQLite Database Constants & DDL Specifications
///
/// Encapsulates table schemas and column identifiers for the embedded
/// offline-first colliery governance data store (`coal_guard_offline.db`).
class DbConstants {
  DbConstants._();

  static const String databaseName = 'coal_guard_offline.db';
  static const int databaseVersion = 1;

  // ===========================================================================
  // Table Names
  // ===========================================================================
  static const String offlineUsersTable = 'offline_users';
  static const String formIvInspectionsTable = 'local_form_iv_inspections';
  static const String inspectionMediaTable = 'local_inspection_media';

  // ===========================================================================
  // Sync Status Enum Values
  // ===========================================================================
  static const String statusPending = 'PENDING';
  static const String statusSynced = 'SYNCED';
  static const String statusFailed = 'FAILED';

  // ===========================================================================
  // SQL DDL Schema Statements
  // ===========================================================================

  /// Users table for offline underground authentication
  static const String createOfflineUsersTableSql = '''
    CREATE TABLE $offlineUsersTable (
      id TEXT PRIMARY KEY,
      rfid_tag TEXT UNIQUE,
      username TEXT UNIQUE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      hashed_password TEXT NOT NULL,
      last_sync_time TEXT
    );
  ''';

  /// Digital CMR 2017 Form IV Shift Diaries
  static const String createFormIvInspectionsTableSql = '''
    CREATE TABLE $formIvInspectionsTable (
      id TEXT PRIMARY KEY,
      sync_id TEXT NOT NULL UNIQUE,
      inspector_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      roof_bolt_torque_nm REAL,
      air_velocity_m_per_min REAL,
      gas_ch4_percent REAL,
      gas_co_ppm REAL,
      strata_remarks TEXT,
      is_geotagged_nfc INTEGER NOT NULL DEFAULT 0,
      inspection_time TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT '$statusPending',
      created_at TEXT NOT NULL
    );
  ''';

  /// Local Media Queue for WebP Evidence
  static const String createInspectionMediaTableSql = '''
    CREATE TABLE $inspectionMediaTable (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'image/webp',
      sync_status TEXT NOT NULL DEFAULT '$statusPending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (inspection_id) REFERENCES $formIvInspectionsTable (id) ON DELETE CASCADE
    );
  ''';

  /// Indexing for fast sync queries
  static const String createFormIvSyncIndexSql = '''
    CREATE INDEX idx_form_iv_sync_status ON $formIvInspectionsTable (sync_status);
  ''';

  static const String createMediaSyncIndexSql = '''
    CREATE INDEX idx_media_sync_status ON $inspectionMediaTable (sync_status);
  ''';
}
